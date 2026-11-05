# 预算执行分析 Mock

四个页面共用这套数据：

- `src/views/statistics/budgetExecutionAnalysis/customYapProjectExecutionByType.vue`
- `src/views/statistics/budgetExecutionAnalysis/yszxylb.vue`
- `src/views/report/proYapMbz.vue`
- `src/views/statistics/yszxylb.vue`

## 使用

导出以当前页面的行、列及展开状态为准，不调用配置或明细接口，不补入未展示的隐藏行。已完整展示的直属子项生成纵向 `SUM`，优先于横向合计；子项未展开或未完整导出时，不生成不完整的纵向汇总，但仍保留同一行的横向、比率及同比/环比公式。公式只引用页面已经加载的数据；缺少计算依赖的单元格保留后端值。

`isZbLine` 为数字 `1` 或字符串 `"1"` 的行只展示后端返回值，沿用页面数字格式，不生成横向、纵向、比率或同比/环比公式，也不按分母修改返回的比率。其他行向上汇总时跳过这些标记行；标记行仍按页面顺序保留在导出文件中。全部子项均为标记行时，父级不生成纵向公式。

开发模式下，`src/main.ts` 通过 `import.meta.env.DEV` 自动加载 `mock/index.ts`。打开上述任一页面，展开“导出与合计校验”，即可查看边界样例和合计节点。

单位选择南京、苏州两家地市公司后，表格增加横向“合计”列；未选单位时展示省公司等六组维度，不增加合计列。切换右上角小数位数后导出，可检查空值、零分母和精度。配置页与报表共用年度、维度、节点 ID 和跨节点绑定，修改节点状态、显示设置或汇总绑定后重新查询可查看结果，刷新浏览器后恢复初始数据。

## 样例与预期

`exportValues.ts` 保存原始值，`reportData.ts` 生成动态列和报表响应。`null`、空字符串样例模拟接口传输边界，Mock 保留原始值。页面直接展示后端值，只处理小数位数、千分位和空值显示，不重算汇总、比率或同比/环比差值，也不按分母修改返回值。只有 Excel 导出会根据引用值重新计算；导出时空分子按 0，空分母按零分母处理并显示 `-`，小额输入不预先截断。

保留默认指标时，南京公司（`DW00101`）的“直属明细合计”和“跨节点合计（明细 A + B）”应相等。下表为接口原始值（比率仍按后端精度返回）：

| 指标 | 南京 | 南京 + 苏州的合计列 |
| --- | ---: | ---: |
| 目标值 MBZ | 300 | 900 |
| 平衡目标值 PHMBZ | 360 | 1080 |
| 年度目标值 MBZ_NEW | 450 | 1350 |
| 完成值 WCZ | 125 | 375 |
| 预算完成率 WCL | 41.67 | 0.35 |
| 预安排完成率 WCL | 34.72 | 0.35 |
| 平衡调整幅度 PHTZFD | 75 | 270 |

Excel 导出按引用值重新计算比率，因此选择 4 位时，南京的预算 WCL 为 `41.6667`、预安排 WCL 为 `34.7222`，两家单位合计 WCL 为 `0.3472`；选择 2 位时分别为 `41.67`、`34.72`、`0.35`。“空比率但引用值完整”的接口 WCL 为 null 时，页面沿用空值格式，Excel 导出才生成计算结果。

合计列的比率倍率、调整幅度公式沿用后端，不直接相加各单位的计算结果。“含隐藏明细的合计”在南京的 MBZ 为 `47`，展开只显示值为 `30` 的明细，另一个值为 `17` 的隐藏明细仍参与后端统计；导出按页面已展示的父子关系汇总为 `30`，不再读取隐藏明细。项目类别筛选后的导出范围同样以页面为准。

Excel 导出中，未选单位时，“江苏省电力公司（母公司）”的完成值、立项值、项目数量等按“机关本部 + 供电公司 + 直属单位（分公司）”汇总，不含“直属单位（子公司）”；省公司再包含子公司。目标值、平衡目标值、年度目标值、待分解和年度待分解也按上述三个分组相加；省公司按“汇总后的母公司 + 子公司”计算，比率使用汇总后的分子、分母。Mock 仍保留后端单独返回的母公司预算值，以验证页面保留该原值、Excel 导出按引用数据重算。

例如“直属明细合计”的母公司 WCZ 为 `625`，省公司为 `750`；接口母公司 MBZ 为 `1200`，Excel 导出按三个分组汇总为 `1500`；省公司 MBZ 从接口 `1500` 重算为 `1800`。选择 4 位时母公司和省公司 WCL 均为 `41.6667`。页面按后端原值显示；Excel 按完整分组重算汇总，缺少引用数据时保留原值。同比环比导出的本期、上期分别遵循这套规则。

“汇总返回空值”和“汇总返回旧值”故意将母公司、省公司的完成值/立项值置为 null / 999，三个分组仍保留明细；页面保持这些接口值，Excel 导出应重算母公司 WCZ=50、LXZ=100，省公司 WCZ=60、LXZ=120。目标值也按三个分组相加为 500；选择 4 位时母公司 WCL=10.0000、LXL=20.0000。只导出比率时，已返回的分子/分母保存为同表隐藏列，保留 Excel 公式和右上角小数位数。

其余样例包含空比率但引用值完整、空分母、负数、高精度金额，以及 MBZ 为 `0.00004` 的小额有效分母。只选择 WCL 时，后端自动补充 MBZ、WCZ，不补充 PHMBZ；预安排地市维度因此返回 WCL 为 `0`。同时选择 PHMBZ 后，按平衡目标值计算。

## 后端依据

参考目录：`/Users/fan/developer/project-process/renren-admin`。

- `src/main/java/io/renren/modules/statements/yszxly/utils/DwUtil.java`：单位分组、合计列条件和指标依赖。
- `src/main/java/io/renren/modules/statements/yszxly/utils/IndicatorEnum.java`：指标公式及合计公式。
- `src/main/java/io/renren/modules/statements/yszxly/service/BudgetStatisticsExtService.java`、`XmmbzYapExtService.java`：扩展版预算 / 预安排统计。
- `src/main/java/io/renren/modules/statements/yszxly/service/BudgetStaticsTbHbService.java`：同比环比字段结构。
- `src/main/resources/mapper/statements.yszxly/BudgetStatisticsConfigMapper.xml`：启用叶子、显示范围与跨节点绑定。

Mock 固定使用扩展版：`YSZXYL_START_YD`、`YSZXYL_START_YAP_YD` 均为 `2`。直属合计统计启用的数据绑定叶子；跨节点合计读取绑定目标下的数据绑定叶子，不递归引用目标的汇总节点。这些服务未应用 `sumMethod` 减法，因此 Mock 也按相加处理。

同比环比沿用后端 `CURRENT` / `LAST`、`TBHBJE` / `TBHBL` 字段，并按 `BudgetStaticsTbHbService` 固定查询 MBZ、WCZ、WCL。上期完成值使用固定系数生成（环比 `0.91`、同比 `0.82`），属于合成数据。

弹窗导出直接使用页面已有的本期、上期数据和父子关系，不再读取年度配置或跨节点绑定。跨节点合计没有页面子项关系时不生成纵向公式，同一行内依赖完整的横向及比率公式仍正常生成；本期、上期分别按页面生成公式，再计算同比 / 环比差值。

同比、环比导出与主表一致：保留 Excel 计算公式，不附加“计算公式说明”工作表或公式备注。

## 验证

```sh
node --test tests/budgetExecutionMock.test.cjs tests/budgetExecutionExport.test.cjs tests/budgetExecutionFormulaHeader.test.cjs tests/budgetExecutionComparison.test.cjs
```

覆盖接口首命中、动态列、指标依赖、页面父子关系、导出零额外请求、数值边界，以及真实 XLSX 序列化后的公式、占位符和小数格式。比较弹窗测试直接执行 Vue setup、查询、懒加载和导出按钮逻辑，替换网络及 VXE 文件下载边界，检查预算 / 预安排的同比、环比两类导出。
