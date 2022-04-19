const client = require('../elasticSearch');
function getOrCreate() {
   client.search({index:"job_search", size: 10, from: 0, body: {
       titie: {
           match: "a"
       }
   }}).then(function (resp) {
       console.log(resp);
    }, function (err) {
         console.trace(err.message);
    });
} 

getOrCreate()


