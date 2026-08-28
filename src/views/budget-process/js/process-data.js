export default {
  //下拉框选项处理
  optionHandleType(arr) {
    arr.forEach((item) => {
      item["value"] = item.id;
      item["label"] = item.name;
      if (item.isLeaf == "1") {
        delete item.children;
      } else {
        item.children.forEach((row) => {
          row["value"] = row.id;
          row["label"] = row.name;
          if (row.isLeaf == "1") {
            delete row.children;
          } else {
            row.children.forEach((val) => {
              val["value"] = val.id;
              val["label"] = val.name;
              if (val.isLeaf == "1") {
                delete val.children;
              } else {
                val.children.forEach((children) => {
                  children["value"] = children.id;
                  children["label"] = children.name;
                  if (children.isLeaf == "1") {
                    delete children.children;
                  } else {
                    children.children.forEach((last) => {
                      last["value"] = last.id;
                      last["label"] = last.name;
                      if (last.isLeaf == "1") {
                        delete last.children;
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
    return arr;
  },

  optionHandleDept(arr) {
    arr.forEach((item) => {
      item["value"] = item.code;
      item["label"] = item.name;
      if (item.isLeaf == "是") {
        delete item.children;
      } else {
        item.children.forEach((row) => {
          row["value"] = row.code;
          row["label"] = row.name;
          if (row.isLeaf == "是") {
            delete row.children;
          } else {
            row.children.forEach((val) => {
              val["value"] = val.code;
              val["label"] = val.name;
              if (val.isLeaf == "是") {
                delete val.children;
              } else {
                val.children.forEach((children) => {
                  children["value"] = children.code;
                  children["label"] = children.name;
                  if (children.isLeaf == "是") {
                    delete children.children;
                  }
                });
              }
            });
          }
        });
      }
    });
    return arr;
  },

  gkbm(arr) {
    arr.forEach((item) => {
      item["value"] = item.code;
      item["label"] = item.name;
      if (item.isLeaf == "1") {
        delete item.children;
      } else {
        item.children.forEach((row) => {
          row["value"] = row.code;
          row["label"] = row.name;
          if (row.isLeaf == "1") {
            delete row.children;
          } else {
            row.children.forEach((val) => {
              val["value"] = val.code;
              val["label"] = val.name;
              if (val.isLeaf == "1") {
                delete val.children;
              } else {
                val.children.forEach((children) => {
                  children["value"] = children.code;
                  children["label"] = children.name;
                  if (children.isLeaf == "1") {
                    delete children.children;
                  } else {
                    children.children.forEach((last) => {
                      last["value"] = last.code;
                      last["label"] = last.name;
                      if (last.isLeaf == "1") {
                        delete last.children;
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
    return arr;
  }
};
