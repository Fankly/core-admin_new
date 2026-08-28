export default {
    tableColumnMerge(data, spanArr, spanIndex) {
        for (let i = 0; i < data.length; i++) {
            if (i === 0) {
                spanArr.push(1);
                spanIndex = 0;
            } else {
                // 判断当前行与前一行内容是否相同
                if (data[i].pspid === data[i - 1].pspid) {
                    spanArr[this.spanIndex] += 1; // 相同的话，当前下标所代表的值加一，例如：第一列的前三行可合并
                    spanArr.push(0); // 记录完毕后，再往数组里添加一个元素0，作为下一次合并的初始值
                } else {
                    spanArr.push(1); // 否则，依旧是一行
                    spanIndex = i;
                }
            }
        }

    }

}