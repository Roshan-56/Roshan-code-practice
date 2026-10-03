"""Rebuild metadata from the pinned, public source snapshots. No problem statements are copied."""
import csv, json, re, urllib.parse, urllib.request, concurrent.futures
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DOOCS='8c570e97ba7b0320392853a8769a6fcb2c277bfa'
COMPANIES='03850eb5d16892514491cf1381c32ec0330a2719'
NAMES = ['Amazon','Google','Microsoft','Meta','Apple','Adobe','Bloomberg','Uber','Oracle','Goldman Sachs','IBM','Infosys','Wipro','Accenture','Deloitte','Cognizant','Capgemini','HCL','Salesforce','SAP','Samsung','Intuit','Atlassian','LinkedIn','ByteDance','Flipkart','Walmart Labs','PayPal','Nvidia','Cisco','Netflix','Airbnb','Qualcomm','Tesla','Spotify','Stripe','TikTok','Zoho','ServiceNow','VMware','eBay','Visa','J.P. Morgan','Morgan Stanley','Databricks','Snowflake','DoorDash','Palantir Technologies','Twilio','Dropbox','Pinterest','Snap','DE Shaw','Citadel','Capital One','Booking.com','Expedia','Swiggy','Zomato','PhonePe','Paytm','Rakuten','Intel']
CACHE=Path('/tmp/company-csvs'); CACHE.mkdir(exist_ok=True)
def get(url):return urllib.request.urlopen(url,timeout=30).read().decode()
indexpath=Path('/tmp/practice-catalogue.txt')
index=indexpath.read_text() if indexpath.exists() else get(f'https://raw.githubusercontent.com/doocs/leetcode/{DOOCS}/solution/README_EN.md')
bytitle={}
for line in index.splitlines():
 m=re.match(r'\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*(.*?)\s*\|\s*(Easy|Medium|Hard)\s*\|\s*(.*?)\s*\|',line)
 if m:bytitle[m[2].casefold()]={'number':int(m[1]),'solutionPath':m[3],'topics':re.findall(r'`([^`]+)`',m[4]),'difficulty':m[5],'premium':'🔒' in m[6]}
def company(name):
 p=CACHE/(name+'.csv')
 text=p.read_text() if p.exists() else get(f'https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/{COMPANIES}/'+urllib.parse.quote(name+'/5. All.csv'))
 return name,list(csv.DictReader(text.splitlines()))
items={}; counts={}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
 for name,rows in pool.map(company,NAMES):
  counts[name]=0
  for row in rows:
   title=row.get('Title','').strip();source=row.get('Link','').strip().rstrip('/')+'/'
   if not re.match(r'^https://leetcode\.com/problems/[a-z0-9-]+/$',source):continue
   meta=bytitle.get(title.casefold())
   if not meta or meta['premium']:continue
   slug=source.split('/')[-2]
   if slug not in items:
    items[slug]={'id':'lc-'+str(meta['number']),'number':meta['number'],'title':title,'difficulty':meta['difficulty'],'topics':[t.strip() for t in (meta['topics'] or [t.strip() for t in row.get('Topics','').split(',') if t.strip()] or ['Uncategorized'])],'source':source,'solutionSource':f'https://github.com/doocs/leetcode/blob/{DOOCS}'+meta['solutionPath'],'companies':[]}
   items[slug]['companies'].append(name); counts[name]+=1
catalog=sorted(items.values(),key=lambda x:x['number'])
assert len(catalog)>=1000
assert len({p['id'] for p in catalog})==len(catalog)
(ROOT/'lib/catalog.json').write_text(json.dumps(catalog,separators=(',',':'))+'\n')
summary={'count':len(catalog),'companyCount':sum(v>0 for v in counts.values()),'topics':sorted({t for p in catalog for t in p['topics']}),'difficultyCounts':{d:sum(p['difficulty']==d for p in catalog) for d in ['Easy','Medium','Hard']},'companies':counts,'sourceSnapshotNote':'Community-reported company data, repository advertised update 20 June 2025; not employer verified. No future interview guarantee.','doocsCommit':DOOCS,'companyCommit':COMPANIES}
(ROOT/'docs/catalog-provenance.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:summary[k] for k in ['count','companyCount','difficultyCounts','topics']},indent=2))
