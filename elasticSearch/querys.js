const talent_search = {
  "sort": [
    {
      "updatedAt": {
        "order": "desc"
      }
    }
  ], 
  "query": {
    "bool": {
      "filter": [
        {
          "bool": {
            "should": [{
              "match": {"Resumes.skills": "C"}
            },{
              "match": {"real_name": "王"}
            }],
            "must": [{
              "range": {
                "JobExpectations.min_salary_expectation": {
                  "lte": 1000
                }
              }},{
              "range": {
                "JobExpectations.max_salary_expectation": {
                "gte": 4000
                }
              }
            },{
              "range": {
                "education.lvl": {
                  "gte": 2
                }
              }
            },{
              "bool": {
                "should": [{
                  "match": {
                    "current_city": "上饶"
                  }
                },{
                  "match": {
                    "JobExpectations.aimed_city": "上饶"
                  }
                }]
              }
            },{
              "match": {
                "gender": true
              }
            },{
              "range": {
                "experience": {
                  "gte": 2
                }
              }
            }]
          }
        }
      ]
    }
  }
}

class QueryBuilder {
  constructor() {
    this.query = {
      sort: [],
      query: {
        bool: {
          filter: [{
            bool: {
              should: [],
              must: []
            }
          }]
        }
      }
    }
  }
  addSort(sort) {
    this.query.sort.push(sort);
  }
  addMust(must) {
    this.query.query.bool.filter[0].bool.must.push(must);
  }
  addShould(should) {
    this.query.query.bool.filter[0].bool.should.push(should);
  }
  newMatch(fieldName, value) {
    let match = new Map();
    match[fieldName] = value
    return {
      match
    }
  }
  newRange(fieldName, lte, gte) {
    let range = {};
    range[fieldName] = {};
    if(lte) range[fieldName].lte = lte;
    if(gte) range[fieldName].gte = gte;
    return {
      range
    }
  }
  newBool(should, must) {
    return {
      bool: {
        should: should? should: [],
        must: must? must: []
      }
    }
  }
  newSort(fieldName, ASC) {
    let sort = {}
    sort[fieldName] = {}
    if(ASC) {
      sort[fieldName].order = "asc";
    } else {
      sort[fieldName].order = "desc";
    }
    return {
      sort
    }
  }
  async send(client, index, size, from) {
    return await client.search({
      index,
      size,
      from,
      body: {...this.query}
    })
  }
  query
}
module.exports = () => {
  return new QueryBuilder();
}