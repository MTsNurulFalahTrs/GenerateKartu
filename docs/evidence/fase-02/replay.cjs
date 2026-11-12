const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const [sourcePath, sheetJsPath, zipPath, outputPath] = process.argv.slice(2);
if (!sourcePath || !sheetJsPath || !zipPath || !outputPath) {
  throw new Error('Usage: node replay.cjs Index.html xlsx.full.min.js jszip.min.js output-directory');
}
const XLSX = require(path.resolve(sheetJsPath));
assert.equal(XLSX.version, '0.18.5');
const JSZip = require(path.resolve(zipPath));
assert.equal(JSZip.version, '3.10.1');
const source = fs.readFileSync(sourcePath);
const blob = crypto.createHash('sha1').update('blob '+source.length+'\0').update(source).digest('hex');
assert.equal(blob, 'b1877096e7aba8f56a61fda60fda45cf30812dfb');
const lines = source.toString('utf8').split('\n');
const slice = (first,last) => lines.slice(first-1,last).join('\n');
const cols = ['NoPeserta','NISN','NamaMurid','Kelas','Ruang'];
const counts = [1,9,10,60,132,500];
const fixtures = path.resolve(outputPath);
fs.mkdirSync(fixtures,{recursive:true});

function participants(count) {
  return Array.from({length:count},(_,i)=>{
    const id = String(i+1).padStart(4,'0');
    return {NoPeserta:'UJI-'+id,NISN:'000000'+id,NamaMurid:'Peserta Uji '+id,Kelas:i%2?'VIII-A':'VII-A',Ruang:'Ruang 1'};
  });
}
function workbook(rows, bookType='xlsx', header=cols) {
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows,{header:[...header]}),'Uji');
  return XLSX.write(wb,{type:'buffer',bookType});
}
const sample=participants(2);
const lowercase=sample.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key.toLowerCase(),value])));
const bad=workbook(sample).subarray(0,128);
const cases=[
  ['xlsx','xlsx',workbook(sample),2,'success'],
  ['xls','xls',workbook(sample,'biff8'),2,'success'],
  ['kapitalisasi','xlsx',workbook(lowercase,'xlsx',cols.map(key=>key.toLowerCase())),2,'success'],
  ['header-hilang','xlsx',workbook([{NamaMurid:'Peserta Uji'}],'xlsx',['NamaMurid']),0,'error'],
  ['kosong','xlsx',workbook([]),0,'error'],
  ['id-duplikat','xlsx',workbook([sample[0],sample[0]]),2,'warning'],
  ['field-kosong','xlsx',workbook([{...sample[0],Kelas:''}]),1,'warning'],
  ['nisn-angka','xlsx',workbook([{...sample[0],NISN:123}]),1,'success'],
  ['workbook-rusak','xlsx',bad,0,'error'],
  ['ekstensi-salah','txt',Buffer.from('data sintetis'),0,'error'],
  ...counts.map(count=>['cetak-'+count,'xlsx',workbook(participants(count)),count,'success'])
];
const noop=()=>{};
class Reader {
  readAsArrayBuffer(file) { this.onload({target:{result:Uint8Array.from(file.buffer).buffer}}); }
}
function sandbox() {
  const notices=[];
  const errors=[];
  return {
    XLSX,FileReader:Reader,notices,errors,
    console:{error:(label,error)=>errors.push({label,message:error?.message})},
    document:{getElementById:()=>({value:'',textContent:''})},
    dbMurid:[],dbFoto:{},currentFormat:'format2',needsRender:false,
    showNotif:(title,body,level)=>notices.push({title,level}),
    tampilkanInfoExcel:noop,updateTabelPreview:noop,updateZipUploadState:noop,tampilkanInfoZip:noop,updateStepperUI:noop,
    jadwalFormatData:{cols:[{label:'Mapel',key:'mapel'},{label:'Jam',key:'jam'}]},
    dbJadwal:[],_setJadwalTampilUploadInfo:noop,_setJadwalRenderDataPreview:noop,_setJadwalRenderPreview:noop,tandaiPerubahan:noop
  };
}
const observations=cases.map(([id,ext,buffer,expectedCount,expectedLevel])=>{
  const name=id+'.'+ext;
  fs.writeFileSync(path.join(fixtures,name),buffer);
  const state=sandbox();
  vm.createContext(state);
  vm.runInContext([slice(3894,3943),slice(6054,6059),slice(6288,6443)].join('\n'),state);
  state.prosesExcel({target:{files:[{name,buffer,size:buffer.length}]}});
  assert.equal(state.dbMurid.length,expectedCount,id);
  assert.equal(state.notices.at(-1).level,expectedLevel,id);
  if(id==='kapitalisasi') assert.equal(state.dbMurid[0].NoPeserta,'UJI-0001');
  if(id==='nisn-angka') assert.equal(state.dbMurid[0].NISN,'0000000123');
  if(id==='workbook-rusak') assert.equal(state.notices.at(-1).title,'Gagal Membaca File');
  return {id,count:state.dbMurid.length,...state.notices.at(-1),...(state.errors.length?{errors:state.errors}:{})};
});
for (const [id,data,header] of [
  ['jadwal-lengkap',[{Mapel:'IPS',Jam:'08.00'}],['Mapel','Jam']],
  ['jadwal-parsial',[{Mapel:'IPS'}],['Mapel']],
  ['jadwal-header-salah',[{Hari:'Senin'}],['Hari']]
]) {
  const buffer=workbook(data,'xlsx',header);
  const name=id+'.xlsx';
  fs.writeFileSync(path.join(fixtures,name),buffer);
  const state=sandbox();
  vm.createContext(state);
  vm.runInContext([slice(6054,6059),slice(5755,5835)].join('\n'),state);
  state.setJadwalImport({target:{files:[{name,buffer,size:buffer.length}]}});
  if(id==='jadwal-header-salah') assert.equal(state.dbJadwal.length,0);
  else assert.equal(state.dbJadwal[0].jam,id==='jadwal-lengkap'?'08.00':'');
  if(id==='jadwal-parsial') assert.deepEqual(state.notices.map(item=>item.level),['warning','success']);
  observations.push({id,count:state.dbJadwal.length,notices:state.notices});
}
async function replayZip() {
  const zip = new JSZip();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP/oAAAAASUVORK5CYII=','base64');
  zip.file('UJI-0001.png',png);
  zip.file('UJI-9999.png',png);
  zip.file('ignored.txt','sintetis');
  const archive=await zip.generateAsync({type:'nodebuffer'});
  for (const [id,buffer,expected,title] of [
    ['zip-cocok-dan-asing',archive,['UJI-0001','UJI-9999'],'Ekstrak Berhasil'],
    ['zip-rusak',archive.subarray(0,16),[],'File ZIP Tidak Valid']
  ]) {
    const name=id+'.zip';
    fs.writeFileSync(path.join(fixtures,name),buffer);
    const state=sandbox();
    state.dbMurid=sample;
    state.dbFoto={lama:'foto lama sintetis'};
    state.JSZip={loadAsync:file=>JSZip.loadAsync(file.buffer)};
    state.Image=class { set src(value) { this.onerror(); } };
    state.document.getElementById=()=>({style:{},value:'',textContent:''});
    state._formatFileSize=String;
    state._zipFileInfo=null;
    let notified;
    const done=new Promise(resolve=>{notified=resolve;});
    state.showNotif=(notice,body,level)=>notified({title:notice,level});
    vm.createContext(state);
    vm.runInContext([slice(3894,3943),slice(6054,6059),slice(6619,6721)].join('\n'),state);
    state.prosesZip({target:{files:[{name,buffer,size:buffer.length}]}});
    const notice=await done;
    assert.equal(notice.title,title,id);
    assert.deepEqual(Object.keys(state.dbFoto).sort(),expected,id);
    observations.push({id,...notice,keys:Object.keys(state.dbFoto).sort(),imageDecoding:'forced-error-double',previousPhotosRetained:Object.hasOwn(state.dbFoto,'lama')});
  }
}
replayZip().then(()=>{
  console.log(JSON.stringify({mode:'node-vm-with-dom-doubles',blob,sheetJS:XLSX.version,jszip:JSZip.version,cases:observations},null,2));
}).catch(error=>{ console.error(error); process.exitCode=1; });
