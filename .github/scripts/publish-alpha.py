import os,sys,json,re,subprocess,tempfile,pathlib,time,urllib.request,hashlib,tarfile,shutil
SHA='06cdfd11108b7ae9433e71e6833ae111871449e9'
APP='coonto-corporate-alpha'
NETWORK='corporate_alpha_internal'
TARGET='tuuvo.app.br'

def run(*args, capture=True):
    p=subprocess.run(args,stdout=subprocess.PIPE if capture else None,stderr=subprocess.PIPE if capture else None,text=True)
    if p.returncode: raise RuntimeError('Command failed: '+' '.join(args[:3]))
    return p.stdout if capture else ''

def rewrite(text):
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

def routes(data,host):
    found=[]
    def visit(x):
        if isinstance(x,dict):
            hosts=[]
            for m in x.get('match',[]):
                if isinstance(m,dict):hosts.extend(m.get('host',[]))
            if host in hosts:found.append(x.get('handle',[]))
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
    print('PASS: shared and isolated Caddy site rewrite preserves unrelated site blocks')
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
mounts=json.loads(run('docker','inspect','caddy_global','--format','{{json .Mounts}}'))
config=None
for m in mounts:
    dest=m['Destination'].rstrip('/')
    if dest=='/etc/caddy/Caddyfile':config=pathlib.Path(m['Source'])
    elif dest=='/etc/caddy':config=pathlib.Path(m['Source'])/'Caddyfile'
if config is None or not config.is_file():raise RuntimeError('Caddyfile host mount could not be established')
original=config.read_text()
candidate=rewrite(original)
backup=base/('Caddyfile.before-alpha-'+str(int(time.time())))
backup.write_text(original);os.chmod(backup,0o600)
candidate_file=base/'Caddyfile.alpha-candidate';candidate_file.write_text(candidate);os.chmod(candidate_file,0o600)
run('docker','cp',str(candidate_file),'caddy_global:/tmp/corporate-alpha-Caddyfile')
run('docker','exec','caddy_global','caddy','validate','--config','/tmp/corporate-alpha-Caddyfile')
before=json.loads(run('docker','exec','caddy_global','caddy','adapt','--config','/etc/caddy/Caddyfile'))
after=json.loads(run('docker','exec','caddy_global','caddy','adapt','--config','/tmp/corporate-alpha-Caddyfile'))
for host in ['tuuvo.com.br','dev.coonto.com']:
    if not routes(before,host) or routes(before,host)!=routes(after,host):raise RuntimeError('Unrelated routing would change: '+host)
if not routes(after,TARGET):raise RuntimeError('Alpha target missing from candidate config')
image='coonto-corporate-alpha:'+SHA[:7]
run('docker','build','-t',image,str(release))
run('docker','run','--rm',image,'npm','test')
if '--preflight' in sys.argv:
    print('PREFLIGHT PASS: Caddy target isolated, other handlers unchanged, Node 22 image built and tests passed')
    sys.exit(0)
if subprocess.run(['docker','network','inspect',NETWORK],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:
    run('docker','network','create',NETWORK)
nets=json.loads(run('docker','inspect','caddy_global','--format','{{json .NetworkSettings.Networks}}'))
if NETWORK not in nets:run('docker','network','connect',NETWORK,'caddy_global')
old=None;started=False;changed=False
try:
    exists=subprocess.run(['docker','container','inspect',APP],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0
    if exists:
        old=APP+'-previous-'+str(int(time.time()))
        run('docker','stop',APP);run('docker','rename',APP,old)
        run('docker','network','disconnect',NETWORK,old)
    run('docker','run','-d','--restart','unless-stopped','--name',APP,'--network',NETWORK,image)
    started=True
    health_script="fetch('http://127.0.0.1:3000/api/health').then(async r=>{if(!r.ok)throw Error('HTTP');let d=await r.json();if(d.service!=='coonto-corporate'||d.version!=='0.1.0-alpha.0')throw Error('wrong service')}).catch(()=>process.exit(1))"
    for attempt in range(20):
        p=subprocess.run(['docker','exec',APP,'node','-e',health_script],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        if p.returncode==0:break
        time.sleep(1)
    else:raise RuntimeError('Alpha readiness failed')
    # Preserve the mounted inode: atomic replacement would leave Docker using the old file.
    changed=True
    with open(config,'w') as f:f.write(candidate);f.flush();os.fsync(f.fileno())
    run('docker','exec','caddy_global','caddy','reload','--config','/etc/caddy/Caddyfile')
    with urllib.request.urlopen('https://'+TARGET+'/api/health',timeout=20) as r:
        if r.status!=200:raise RuntimeError('Public HTTP health failed')
        d=json.load(r)
        if d.get('service')!='coonto-corporate' or d.get('version')!='0.1.0-alpha.0':raise RuntimeError('Public host returned wrong service')
    with urllib.request.urlopen('https://'+TARGET+'/experience',timeout=20) as r:
        if r.status!=200 or b'<!DOCTYPE html>' not in r.read(100000):raise RuntimeError('Public experience failed')
    print('PUBLISHED: Alpha 0.1.0-alpha.0; Corporate host verified; unrelated Caddy handlers preserved; backup retained')
except BaseException:
    if changed:
        with open(config,'w') as f:f.write(original);f.flush();os.fsync(f.fileno())
        run('docker','exec','caddy_global','caddy','reload','--config','/etc/caddy/Caddyfile')
    if started:run('docker','rm','-f',APP)
    if old:
        run('docker','rename',old,APP);run('docker','network','connect',NETWORK,APP);run('docker','start',APP)
    raise
