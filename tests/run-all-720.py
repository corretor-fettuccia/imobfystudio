import subprocess,json,time
from pathlib import Path
root=Path(__file__).resolve().parent.parent
results=[]
for f in sorted((root/'tests').glob('*.test.cjs')):
    try:
        r=subprocess.run(['node',str(f)],cwd=str(root),capture_output=True,text=True,timeout=22)
        status='pass' if r.returncode==0 else 'fail'
        log=(r.stdout+r.stderr).strip()
    except subprocess.TimeoutExpired:
        status='timeout';log='test excedeu 22 segundos'
    results.append({'name':f.name,'status':status,'message':log[-1100:]})
    print(f'{status.upper():7} {f.name}',flush=True)
report={'version':'7.2.0','tests':len(results),'passed':sum(x['status']=='pass' for x in results),'failed':sum(x['status']=='fail' for x in results),'timedOut':sum(x['status']=='timeout' for x in results),'results':results}
(root/'tests/RESULTADOS-7.2.0.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('TOTAL',report['tests'],'PASS',report['passed'],'FAIL',report['failed'],'TIMEOUT',report['timedOut'])
for x in results:
 if x['status']!='pass':print('FAIL_DETAIL',x['name'],x['message'][-350:])
