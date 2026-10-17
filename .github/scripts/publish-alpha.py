import os,sys,json,re,subprocess,tempfile,pathlib,time,urllib.request,hashlib,tarfile,shutil
SHA='a148d9574707a5174081148681269fbd4a2114a2'
APP='coonto-corporate-alpha'
NETWORK='corporate_alpha_internal'
TARGET='tuuvo.app.br'
STAGE='E01'
def safe_exception(typ,value,tb):
    print('DEPLOY_CODE='+STAGE,flush=True)
    print('::error title=Alpha publication::'+str(value).replace('\n',' '),flush=True)
    sys.__excepthook__(typ,value,tb)
sys.excepthook=safe_exception

def run(*args, capture=True):
    p=subprocess.run(args,stdout=subprocess.PIPE if capture else None,stderr=subprocess.PIPE if capture else None,text=True)
    if p.returncode: raise RuntimeError('Command failed: '+' '.join(args))
    return p.stdout if capture else ''

def activate_config():
    try:
        run('docker','exec','caddy_global','caddy','reload','--config','/etc/caddy/Caddyfile','--adapter','caddyfile')
    except RuntimeError:
        run('docker','restart','caddy_global')

def rewrite(text,allow_missing=False):
    tokens=list(re.finditer(r'#[^\n]*|"(?:\\.|[^"\\])*"|`[^`]*`|[{}]|[^\s{},]+',text))
    depth=0; header=[]; blocks=[]; current=None
    for token in tokens:
        value=token.group()
        if value.startswith('#'):continue
        if value=='{':
            if depth==0:
                current=(header[:],token)
            depth+=1
        elif value=='}':
            depth-=1
            if depth<0:raise RuntimeError('Unexpected Caddyfile structure')
            if depth==0:
                blocks.append((current,token));header=[];current=None
        elif depth==0:header.append(token)
    if depth:raise RuntimeError('Unbalanced Caddyfile')
    matches=[]
    for (labels,opening),closing in blocks:
        matching=[t for t in labels if t.group() in [TARGET,'https://'+TARGET,TARGET+':443','https://'+TARGET+':443']]
        if matching:matches.append((labels,opening,closing,matching))
    if not matches and allow_missing:
        return text.rstrip()+'\n\n'+TARGET+' {\n    reverse_proxy '+APP+':3000\n}\n'
    if len(matches)!=1:raise RuntimeError('Target must appear in exactly one explicit Caddyfile site block')
    labels,opening,closing,matching=matches[0]
    if len(matching)!=1:raise RuntimeError('Ambiguous target labels')
    # Reject imported/directive structures masquerading as site labels.
    if any(t.group() in ['import','snippet','map','route'] for t in labels):raise RuntimeError('Unsupported target configuration')
    remaining=[t.group() for t in labels if t not in matching]
    if remaining:
        revised=text[:labels[0].start()]+', '.join(remaining)+' '+text[opening.start():]
    else:
        revised=text[:labels[0].start()]+text[closing.end():]
    return revised.rstrip()+'\n\n'+TARGET+' {\n    reverse_proxy '+APP+':3000\n}\n'

def comparable_handlers(value):
    # Caddy adds the input Caddyfile path to file_server.hide during adaptation.
    # The temporary validation file is the same configuration at another path.
    if isinstance(value,list):return [comparable_handlers(v) for v in value]
    if not isinstance(value,dict):return value
    result={key:comparable_handlers(v) for key,v in value.items()}
    if result.get('handler')=='file_server' and isinstance(result.get('hide'),list):
        result['hide']=['/etc/caddy/Caddyfile' if item=='/tmp/corporate-alpha-Caddyfile' else item for item in result['hide']]
    return result

def routes(data,host):
    found=[]
    def visit(x):
        if isinstance(x,dict):
            hosts=[]
            for m in x.get('match',[]):
                if isinstance(m,dict):hosts.extend(m.get('host',[]))
            if host in hosts:found.append(comparable_handlers(x.get('handle',[])))
            for v in x.values():visit(v)
        elif isinstance(x,list):
            for v in x:visit(v)
    visit(data)
    return found

if '--test-rewrite' in sys.argv:
    examples=[('tuuvo.com.br, tuuvo.app.br {\n reverse_proxy site:80\n}\ndev.coonto.com { reverse_proxy school:3000 }\n','tuuvo.com.br {'),('tuuvo.app.br { reverse_proxy site:80 }\n','tuuvo.app.br {\n    reverse_proxy coonto-corporate-alpha:3000')]
    for original,expected in examples:
        updated=rewrite(original);assert expected in updated;assert updated.count('tuuvo.app.br')==1
        if 'dev.coonto.com' in original:assert 'dev.coonto.com { reverse_proxy school:3000 }' in updated
    missing='dev.coonto.com { reverse_proxy school:3000 }\n'
    added=rewrite(missing,allow_missing=True)
    assert added.startswith(missing.rstrip()) and added.count(TARGET)==1
    try:rewrite(missing)
    except RuntimeError:pass
    else:raise AssertionError('Missing sites require explicit opt-in')
    try:rewrite(TARGET+' { respond 200 }\n'+TARGET+' { respond 201 }',allow_missing=True)
    except RuntimeError:pass
    else:raise AssertionError('Duplicate sites must remain rejected')
    handler={'handler':'file_server','hide':['/etc/caddy/Caddyfile','private/*']}
    candidate={'handler':'file_server','hide':['/tmp/corporate-alpha-Caddyfile','private/*']}
    assert comparable_handlers(handler)==comparable_handlers(candidate)
    changed={'handler':'file_server','hide':['/tmp/corporate-alpha-Caddyfile','private/*','other/*']}
    assert comparable_handlers(handler)!=comparable_handlers(changed)
    assert comparable_handlers({'handler':'reverse_proxy','upstreams':[{'dial':'one:3000'}]})!=comparable_handlers({'handler':'reverse_proxy','upstreams':[{'dial':'two:3000'}]})
    print('PASS: shared, isolated and missing target handling; Caddy adapter metadata normalized while real static and proxy route differences stay detectable')
    sys.exit(0)

archive=pathlib.Path(sys.argv[1]).resolve()
base=pathlib.Path('/opt/coonto/corporate-alpha')
base.mkdir(parents=True,exist_ok=True)
release=pathlib.Path(tempfile.mkdtemp(prefix=SHA[:7]+'-',dir=base))
with tarfile.open(archive) as t:
    for member in t.getmembers():
        path=(release/member.name).resolve()
        if not str(path).startswith(str(release.resolve())+'/') or member.issym() or member.islnk():raise RuntimeError('Unsafe archive member')
    t.extractall(release)
for root,dirs,files in os.walk(release):
    os.chmod(root,0o755)
    for name in files:os.chmod(pathlib.Path(root)/name,0o644)
# Check the existing proxy configuration before changing services.
STAGE='E02'
mounts=json.loads(run('docker','inspect','caddy_global','--format','{{json .Mounts}}'))
config=None
for m in mounts:
    dest=m['Destination'].rstrip('/')
    if dest=='/etc/caddy/Caddyfile':config=pathlib.Path(m['Source'])
    elif dest=='/etc/caddy':config=pathlib.Path(m['Source'])/'Caddyfile'
if config is None or not config.is_file():raise RuntimeError('Caddyfile host mount could not be established')
startup=json.loads(run('docker','inspect','caddy_global'))[0]
startup_args=[startup.get('Path','')]+startup.get('Args',[])
if '/etc/caddy/Caddyfile' not in startup_args:raise RuntimeError('Proxy restart must use the verified configuration path')
original=config.read_text()
baseline=json.loads(run('docker','exec','caddy_global','caddy','adapt','--config','/etc/caddy/Caddyfile','--adapter','caddyfile'))
candidate=rewrite(original,allow_missing=not routes(baseline,TARGET))
backup=base/('Caddyfile.before-alpha-'+str(int(time.time())))
backup.write_text(original);os.chmod(backup,0o600)
candidate_file=base/'Caddyfile.alpha-candidate';candidate_file.write_text(candidate);os.chmod(candidate_file,0o600)
run('docker','cp',str(candidate_file),'caddy_global:/tmp/corporate-alpha-Caddyfile')
STAGE='E03'
run('docker','exec','caddy_global','caddy','validate','--config','/tmp/corporate-alpha-Caddyfile','--adapter','caddyfile')
before=json.loads(run('docker','exec','caddy_global','caddy','adapt','--config','/etc/caddy/Caddyfile','--adapter','caddyfile'))
after=json.loads(run('docker','exec','caddy_global','caddy','adapt','--config','/tmp/corporate-alpha-Caddyfile','--adapter','caddyfile'))
STAGE='E04'
for host in ['tuuvo.com.br','dev.coonto.com','coonto.com','www.coonto.com']:
    if routes(before,host)!=routes(after,host):raise RuntimeError('Unrelated routing would change: '+host)
if not routes(after,TARGET):raise RuntimeError('Alpha target missing from candidate config')
image='coonto-corporate-alpha:'+SHA[:7]
STAGE='E05'
run('docker','build','-t',image,str(release))
STAGE='E06'
run('docker','run','--rm',image,'npm','test')
if '--preflight' in sys.argv:
    print('PREFLIGHT PASS: Caddy target isolated, other handlers unchanged, Node 22 image built and tests passed')
    sys.exit(0)
STAGE='E07'
if subprocess.run(['docker','network','inspect',NETWORK],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:
    run('docker','network','create',NETWORK)
nets=json.loads(run('docker','inspect','caddy_global','--format','{{json .NetworkSettings.Networks}}'))
if NETWORK not in nets:run('docker','network','connect',NETWORK,'caddy_global')
feedback=base/'feedback'
feedback.mkdir(exist_ok=True,mode=0o700)
node_uid=int(run('docker','run','--rm',image,'id','-u').strip())
node_gid=int(run('docker','run','--rm',image,'id','-g').strip())
os.chown(feedback,node_uid,node_gid);os.chmod(feedback,0o700)
old=None;started=False;changed=False
try:
    STAGE='E08'
    exists=subprocess.run(['docker','container','inspect',APP],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0
    if exists:
        old=APP+'-previous-'+str(int(time.time()))
        run('docker','stop',APP);run('docker','rename',APP,old)
        run('docker','network','disconnect',NETWORK,old)
    STAGE='E09'
    run('docker','run','-d','--restart','unless-stopped','--name',APP,'--network',NETWORK,'--mount','type=bind,source='+str(feedback)+',target=/app/data/feedback','--env','FEEDBACK_DIR=/app/data/feedback',image)
    started=True
    STAGE='E10'
    health_script="fetch('http://127.0.0.1:3000/api/health').then(async r=>{if(!r.ok)throw Error('HTTP');let d=await r.json();if(d.service!=='coonto-corporate'||d.version!=='0.1.0-alpha.12')throw Error('wrong service')}).catch(()=>process.exit(1))"
    for attempt in range(20):
        p=subprocess.run(['docker','exec',APP,'node','-e',health_script],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        if p.returncode==0:break
        time.sleep(1)
    else:raise RuntimeError('Alpha readiness failed')
    run('docker','exec',APP,'node','--input-type=module','-e',"import {writeFile,unlink} from 'node:fs/promises'; const p='/app/data/feedback/.readiness'; await writeFile(p,'ready',{mode:0o600,flush:true}); await unlink(p);")
    # Preserve the mounted inode: atomic replacement would leave Docker using the old file.
    STAGE='E11'
    changed=True
    with open(config,'w') as f:f.write(candidate);f.flush();os.fsync(f.fileno())
    STAGE='E12'
    activate_config()
    STAGE='E13'
    for attempt in range(20):
        try:
            with urllib.request.urlopen('https://'+TARGET+'/api/health',timeout=10) as r:
                if r.status!=200:raise RuntimeError('Public HTTP health failed')
                d=json.load(r)
                if d.get('service')!='coonto-corporate' or d.get('version')!='0.1.0-alpha.12':raise RuntimeError('Public host returned wrong service')
            break
        except Exception:
            if attempt==19:raise
            time.sleep(2)
    STAGE='E14'
    with urllib.request.urlopen('https://'+TARGET+'/experience',timeout=20) as r:
        if r.status!=200 or b'<!doctype html>' not in r.read(100000).lower():raise RuntimeError('Public experience failed')
    print('PUBLISHED: Alpha 0.1.0-alpha.12; Corporate host verified; unrelated Caddy handlers preserved; backup retained')
except BaseException:
    failure_stage=STAGE
    STAGE='E15'
    if changed:
        with open(config,'w') as f:f.write(original);f.flush();os.fsync(f.fileno())
        activate_config()
    if started:run('docker','rm','-f',APP)
    if old:
        run('docker','rename',old,APP);run('docker','network','connect',NETWORK,APP);run('docker','start',APP)
    STAGE=failure_stage
    raise
