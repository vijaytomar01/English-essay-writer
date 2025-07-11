// Test script to verify the 500 error fixes
const testEssay = `this is my test essay about techenology. i think techenology is very importent for everyone but their are many problem. many student is not getting proper education because they doesn't have good teacher`;

console.log('🧪 Testing API Error Fixes...\n');

fetch('http://localhost:3000/api/openai-check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: testEssay })
})
.then(res => {
  console.log(`📊 Response Status: ${res.status} ${res.statusText}`);
  return res.json();
})
.then(data => {
  if (data.success) {
    console.log('✅ API Request Successful!');
    console.log(`📈 Overall Score: ${data.analysis.overallScore}/100 (${data.analysis.grade})`);
    console.log(`🔍 Total Issues Found: ${data.analysis.totalIssues}`);
    console.log(`🛠️ Provider: ${data.provider}`);
    
    if (data.analysis.spellingIssues?.length > 0) {
      console.log('\n📝 Spelling Issues:');
      data.analysis.spellingIssues.forEach(issue => {
        console.log(`  - "${issue.word}" → "${issue.correction}"`);
      });
    }
    
    if (data.analysis.punctuationIssues?.length > 0) {
      console.log('\n🔤 Punctuation Issues:');
      data.analysis.punctuationIssues.forEach(issue => {
        console.log(`  - ${issue.message}`);
      });
    }
    
    if (data.analysis.subjectVerbAgreementIssues?.length > 0) {
      console.log('\n📚 Subject-Verb Agreement Issues:');
      data.analysis.subjectVerbAgreementIssues.forEach(issue => {
        console.log(`  - "${issue.text}" → "${issue.correction}"`);
      });
    }
    
    console.log(`\n💬 Summary: ${data.analysis.summary}`);
    console.log('\n🎉 500 Error Fixed Successfully!');
  } else {
    console.log('❌ API Request Failed:');
    console.log('Error:', data.error);
    console.log('Details:', data.details);
  }
})
.catch(err => {
  console.error('❌ Network Error:', err.message);
  console.log('\n🔧 This might indicate the server is not running or there are network issues.');
});
