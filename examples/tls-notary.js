process.env.AWS_ACCESS_KEY_ID = 'AKIAI73YIGOIBAHBMCWA';
process.env.AWS_SECRET_ACCESS_KEY = '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';
process.env.AWS_REGION = 'eu-west-1'
const lambda = require('aws-lambda-invoke');


lambda.invoke('notarize', {
  url: 'www.reddit.com',
  headers: {
  }
}).then(result => {
  console.log(result);
  const auditFileUrl = result.audit_file;

  lambda.invoke('auditor', {
    audit_file_url: auditFileUrl
  }).then(result => {
    console.log(result);
  }).catch(err => {
    console.log('auditor:' + err);
  });

}).catch(err => {
  console.log('notarize:' + err);
});

