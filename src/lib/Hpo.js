class Hpo {
  constructor(mongooseModel) {
    this.Model = mongooseModel;
  }

  getAncestors = async (hpo, result = []) => {
    const data = await this.Model.findOne({ id: hpo });
    if (data.is_a !== undefined && data.is_a.length > 0) {
      result = result.concat(data.is_a);
      for (let h of data.is_a) {
        return this.getAncestors(h, result);
      }
    } else {
      return result;
    }
  };

  getMinGraph = async hpoList => {
    /*
        get a miniminsed graph given a hpoList. For rendering a node graph.
        e.g.
        ```
        this.getMinGraph(['HP:0007754','HP:0000505','HP:0000510'])
        ```
        returns
        [
          {
            "id": "HP:0007754", 
            "is_a": "HP:0000556"
          }, 
          {
            "id": "HP:0000556", 
            "is_a": "HP:0000478"
          }, 
          {
            "id": "HP:0000478", 
            "is_a": null
          }, 
          {
            "id": "HP:0000505", 
            "is_a": "HP:0000478"
          }, 
          {
            "id": "HP:0000510", 
            "is_a": "HP:0000556"
          }
        ]
        */
    if (hpoList.length === 1) {
      const id = hpoList[0];
      // just one hpo term
      result = [{ id, is_a: null }];
      const record = await this.Model.findOne({ id });
      if (record.is_a !== undefined && record.is_a.length > 0) {
        result[0].is_a = record.is_a;
        for (let anc of record.is_a) {
          result.push({ id: anc, is_a: null });
        }
      }
      return result;
    }
    let ancestorList = [];
    for (let h of hpoList) {
      const ancestors = await this.getAncestors(h);
      ancestorList.push([h].concat(ancestors));
    }
    const ancestorCount = counter(ancestorList);
    // sort hpoList and ancestorList so that more specific terms come first
    const sortedIndex = getSortedIndex(hpoList, ancestorCount);
    let result = [],
      seen = {};
    for (let hpoIndex of sortedIndex) {
      const count = ancestorCount[hpoList[hpoIndex]];
      ancestorList[hpoIndex].map((ancestor, ancIndex) => {
        if (ancIndex === 0 && !(ancestor in seen)) {
          result.push({ id: ancestor, is_a: null });
        } else {
          if (ancestorCount[ancestor] > count) {
            count = ancestorCount[ancestor];
            if (result[result.length - 1].is_a === null) {
              result[result.length - 1].is_a = ancestor;
            }
            if (!(ancestor in seen)) {
              result.push({ id: ancestor, is_a: null });
              seen[ancestor] = 1;
            }
          }
        }
      });
    }
    return result;
  };
}

const counter = data => {
  // given a list (of lists), return elements as key, counts as value
  let result = {};
  const innerCounter = e => {
    if (e in result) {
      result[e] += 1;
    } else {
      result[e] = 1;
    }
  };
  for (let ele of data) {
    if (Array.isArray(ele)) {
      ele.map(e => innerCounter(e));
    } else {
      innerCounter(e);
    }
  }
  return result;
};

const getSortedIndex = (hpos, count) => {
  let indexedTest = hpos.map((e, i) => {
    return { ind: i, val: e };
  });
  // sort index/value couples, based on values
  indexedTest.sort((x, y) => {
    return count[x.val] > count[y.val]
      ? 1
      : count[x.val] == count[y.val]
      ? 0
      : -1;
  });
  // make list keeping only indices
  return indexedTest.map(e => e.ind);
};
// export
module.exports = Hpo;
