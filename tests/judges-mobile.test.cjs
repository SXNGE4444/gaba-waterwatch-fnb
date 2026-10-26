const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');const file=name=>fs.readFileSync(path.join(root,name),'utf8');
test('0.9.7 preserves proven v0.9.2 package identity and enforces login',()=>{
 const gradle=file('android/app/build.gradle'), index=file('native-judges/index.html'), community=file('native-judges/community.html');
 assert.match(gradle,/applicationId "za\.co\.lastdices\.gabawaterwatch\.fnb"/);
 assert.match(gradle,/versionName "0\.9\.7"/);
 assert.match(index,/GABA_NATIVE_LOGIN_FIRST=true/);
 assert.match(community,/html\.needs-auth body/);
 assert.match(community,/mobile-session\.js/);
 assert.match(community,/id="report-form"/);
});
test('unverified or expired native sessions cannot open the community app',()=>{
 const guard=file('native-judges/mobile-session.js');
 assert.match(guard,/email_confirmed_at/);
 assert.match(guard,/location\.replace\('index\.html'\)/);
 assert.match(guard,/refresh_token/);
});
test('restricted operator access remains separate',()=>{
 const app=file('native-judges/app.js');assert.match(app,/ops-locked/);
});
