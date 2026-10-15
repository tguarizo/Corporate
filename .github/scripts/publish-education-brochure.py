"""Publish only the educator landing page, brochure, artwork and home entry link."""
import hashlib,json,os,pathlib,re,shutil,subprocess,sys,tarfile,tempfile,time,urllib.request

ALLOWED={'para-educadores/index.html','materiais/coonto-educacao-parcerias.pdf','materiais/coonto-logo.png','materiais/coonto-icon.png','materiais/coonto-apresentacao-capa.png'}
def run(*args):return subprocess.check_output(args,text=True,stderr=subprocess.DEVNULL)
def notice(message):print('::notice title=Coonto presentation publication::'+message,flush=True)
def fetch(path):
    with urllib.request.urlopen('https://coonto.com'+path,timeout=30) as response:
        return response.status,response.headers,response.read()
def atomic(path,data,mode=0o644,owner=None):
    path.parent.mkdir(parents=True,exist_ok=True,mode=0o755)
    fd,tmp=tempfile.mkstemp(prefix='.coonto-presentation-',dir=path.parent)
    try:
        with os.fdopen(fd,'wb') as out:out.write(data);out.flush();os.fsync(out.fileno())
        os.chmod(tmp,mode)
        if owner:os.chown(tmp,*owner)
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp):os.unlink(tmp)

def main():
    assert os.geteuid()==0,'Run with sudo'
    config=json.loads(run('docker','exec','caddy_global','caddy','adapt','--config','/etc/caddy/Caddyfile'))
    roots=[]
    def collect_root(x):
        if isinstance(x,dict):
            if x.get('handler')=='vars' and 'root' in x:roots.append(x['root'])
            assert x.get('handler')!='reverse_proxy','Production is no longer a static host'
            for v in x.values():collect_root(v)
        elif isinstance(x,list):
            for v in x:collect_root(v)
    def find(x):
        if isinstance(x,dict):
            hosts=[h for m in x.get('match',[]) for h in m.get('host',[])]
            if 'coonto.com' in hosts:
                assert hosts==['coonto.com'],'Unexpected shared production route'
                collect_root(x.get('handle',[]));return
            for v in x.values():find(v)
        elif isinstance(x,list):
            for v in x:find(v)
    find(config)
    assert roots==['/opt/coonto/prod'],'Unexpected production root'
    inside=pathlib.PurePosixPath(roots[0])
    proxy=json.loads(run('docker','inspect','caddy_global'))[0]
    mounts=[m for m in proxy['Mounts'] if m['Type']=='bind' and inside.is_relative_to(m['Destination'])]
    assert mounts,'No production bind mount found'
    mount=max(mounts,key=lambda m:len(m['Destination']))
    root=(pathlib.Path(mount['Source'])/inside.relative_to(mount['Destination'])).resolve()
    home=root/'index.html';assert home.is_file() and not home.is_symlink(),'Missing production home'
    original=home.read_bytes();owner=(home.stat().st_uid,home.stat().st_gid)
    text=original.decode('utf-8');assert '<div id="app"></div>' in text,'Unexpected production entry'
    marker='coonto-educadores-access'
    fragment='\n<nav id="coonto-educadores-access" aria-label="Educadores e instituições" style="display:block;box-sizing:border-box;padding:12px 18px;text-align:center;background:#101c36;border-bottom:1px solid #34456a;font:14px/1.5 system-ui,sans-serif"><a href="/para-educadores/" style="display:inline-block;color:#eef2ff;text-decoration:underline;text-underline-offset:3px">Para educadores e instituições · Conheça o Coonto e baixe a apresentação →</a></nav>\n'
    if marker in text:
        assert text.count(marker)==1 and 'href="/para-educadores/"' in text
        updated=original
    else:
        assert len(re.findall(r'<body\b[^>]*>',text,re.I))==1
        updated=re.sub(r'(<body\b[^>]*>)',lambda m:m.group(1)+fragment,text,count=1,flags=re.I).encode()
        assert updated.decode().replace(fragment,'',1)==text
    files={}
    with tarfile.open(sys.argv[1],'r:gz') as archive:
        for member in archive.getmembers():
            if member.isdir():continue
            name=member.name.removeprefix('./')
            assert member.isfile() and name in ALLOWED,'Unexpected package member'
            assert name not in files
            files[name]=archive.extractfile(member).read()
    assert set(files)==ALLOWED,'Incomplete brochure package'
    pdf=files['materiais/coonto-educacao-parcerias.pdf'];assert pdf.startswith(b'%PDF-')
    page=files['para-educadores/index.html'];assert b'Coonto-Educacao-Parcerias.pdf' in page and b'dev.coonto.com' in page
    targets={root/name:data for name,data in files.items()};targets[home]=updated
    before={}
    for path in targets:
        assert path.resolve().is_relative_to(root) and not path.is_symlink(),'Unsafe target'
        if path.exists():
            assert path.is_file()
            before[path]=(path.read_bytes(),path.stat().st_mode&0o777,(path.stat().st_uid,path.stat().st_gid))
            if path.name=='index.html' and path!=home:assert b'coonto-educacao-parcerias.pdf' in before[path][0],'Existing page is not ours'
        else:before[path]=None
    backup=pathlib.Path('/var/backups/coonto-educadores')/(time.strftime('%Y%m%dT%H%M%SZ',time.gmtime())+'-'+str(os.getpid()))
    backup.mkdir(parents=True,mode=0o700)
    for path,prior in before.items():
        if prior:
            saved=backup/path.relative_to(root);saved.parent.mkdir(parents=True,exist_ok=True,mode=0o700);saved.write_bytes(prior[0]);saved.chmod(0o600)
    try:
        for path,data in targets.items():atomic(path,data,owner=owner)
        assert home.read_bytes()==updated
        status,headers,body=fetch('/materiais/coonto-educacao-parcerias.pdf')
        assert status==200 and headers.get_content_type()=='application/pdf' and body==pdf,'Public PDF validation failed'
        status,headers,body=fetch('/para-educadores/')
        assert status==200 and 'Para educadores e instituições | Coonto' in body.decode() and b'download="Coonto-Educacao-Parcerias.pdf"' in body,'Public educator page validation failed'
        status,headers,body=fetch('/')
        assert status==200 and marker.encode() in body and b'src="app.js"' in body,'Home entry link validation failed'
        notice('Published https://coonto.com/para-educadores/ and the four-page PDF; home entry link verified; existing experience files and proxy configuration preserved.')
        notice('PDF SHA256='+hashlib.sha256(pdf).hexdigest())
    except BaseException:
        for path,prior in before.items():
            if prior:atomic(path,prior[0],prior[1],prior[2])
            elif path.exists():path.unlink()
        raise

if __name__=='__main__':main()
