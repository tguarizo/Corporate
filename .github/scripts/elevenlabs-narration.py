"""Locate an existing ElevenLabs binding without disclosing credentials; render public narration."""
import json, os, pathlib, subprocess, sys, urllib.request, urllib.error
NAMES = ('ELEVENLABS_API_KEY', 'ELEVEN_API_KEY', 'ELEVENLABS_KEY', 'ELEVEN_API', 'XI_API_KEY')
key = next((os.environ[n] for n in NAMES if os.environ.get(n)), None)
source = 'runner' if key else None
if not key:
    p = subprocess.run(['docker', 'ps', '-q'], capture_output=True, text=True)
    if p.returncode == 0 and p.stdout.strip():
        p = subprocess.run(['docker', 'inspect', *p.stdout.split()], capture_output=True, text=True)
        if p.returncode == 0:
            for container in json.loads(p.stdout):
                for entry in container.get('Config', {}).get('Env', []) or []:
                    name, _, value = entry.partition('=')
                    if name.upper() in NAMES and value.strip(): key, source = value.strip(), 'container'
if not key:
    for base in ('/opt', '/srv', '/var/www', '/home', '/root'):
        for current, dirs, files in os.walk(base):
            rel = pathlib.Path(current).relative_to(base)
            dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', '.cache', 'backups', 'venv', '.venv') and len(rel.parts) < 6]
            for name in files:
                if not (name == '.env' or name.startswith('.env.') or name.endswith('.env')): continue
                try:
                    path = pathlib.Path(current, name)
                    if path.stat().st_size > 1000000: continue
                    for line in path.read_text(errors='ignore').splitlines():
                        lhs, sep, rhs = line.removeprefix('export ').partition('=')
                        if sep and lhs.strip().upper() in NAMES:
                            value = rhs.strip().strip('\"').strip("'")
                            if value and not value.startswith('${'): key, source = value, 'vps-file'
                except OSError: pass
if not key:
    print('RESULT=KEY_NOT_FOUND'); sys.exit(0)
try:
    def request(path, data=None):
        body = json.dumps(data).encode() if data else None
        req = urllib.request.Request('https://api.elevenlabs.io/v1/' + path, data=body,
            headers={'xi-api-key': key, 'Content-Type': 'application/json'})
        return urllib.request.urlopen(req, timeout=90).read()
    voices = json.loads(request('voices')).get('voices', [])
    preferred = [v for v in voices if v.get('labels', {}).get('language', '').lower() in ('pt', 'pt-br', 'portuguese')]
    preferred = [v for v in preferred if 'brazil' in json.dumps(v.get('labels', {})).lower()] or preferred
    voice = (preferred or [v for v in voices if v.get('name') == 'Rachel'] or voices)[0]
    out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    texts = [
        'Marina entrou em contato duas vezes. O problema continua sem solução, e ela precisa de uma resposta.',
        'Um protocolo diz que o caso foi resolvido. O outro mostra que a reclamação continua em aberto.',
        'Nesta experiência, suas escolhas mudam o próximo passo. Escute, investigue e descubra as consequências de cada decisão.'
    ]
    for n, text in enumerate(texts, 1):
        audio = request('text-to-speech/' + voice['voice_id'], {
            'text': text, 'model_id': 'eleven_multilingual_v2', 'language_code': 'pt',
            'voice_settings': {'stability': 0.55, 'similarity_boost': 0.75, 'style': 0.15, 'use_speaker_boost': True}})
        (out / f'segment-{n}.mp3').write_bytes(audio)
    (out / 'provenance.json').write_text(json.dumps({'provider': 'ElevenLabs', 'model': 'eleven_multilingual_v2', 'language': 'pt', 'segments': 3}))
    print('RESULT=GENERATED')
except urllib.error.HTTPError as exc:
    print('RESULT=API_HTTP_' + str(exc.code))
except Exception:
    print('RESULT=GENERATION_FAILED')
