import { reactive, ref } from 'vue'

export function echartOption() {
  const barLoadingOptions = ref<any>({
    text: 'Loading…',
    color: '#4ea397',
    maskColor: 'rgba(255, 255, 255, 0.4)'
  })

  // 柱状图
  const bmOBarOptions = reactive<any>({
    title: {
      text: '专业归口预算执行查询',
      x: 'center',
      y: '4%',
      textStyle: {
        color: '#000',
        fontWeight: 'bold',
        fontFamily: 'Microsoft YaHei',
        fontSize: '16px'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '1%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    legend: {
      // icon: 'rect',
      x: 'center',
      y: 'bottom',
      textStyle: {
        color: '#6a6866'
      },
      itemWidth: 12,
      itemHeight: 10
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLine: {
        show: false,
        lineStyle: {
          color: '#6a6866'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        textStyle: {
          fontFamily: 'Microsoft YaHei',
          padding: [20, 0, 0, 105]
        },
        interval: 0,
        rotate: 15,
        clickable: true,
        rich: {
          a: {
            color: 'blue',
            textDecoration: 'underline',
            cursor: 'pointer'
          }
        }
      },
      silent: false,
      triggerEvent: true
    },
    yAxis: {
      name: '百分比(%)',
      nameTextStyle: {
        color: '#9eaabb',
        fontSize: 12
      },
      type: 'value',
      axisLine: {
        show: false,
        lineStyle: {
          color: '#939aa3'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#efefef'
        }
      }
    },
    series: [
      {
        name: '分解率',
        type: 'bar',
        barWidth: 10,
        // label: {
        //   show: true,
        //   position: 'top'
        // },
        itemStyle: {
          color: '#3ba9fd',
          borderRadius: [2, 2, 0, 0]
        },
        data: []
      },
      {
        name: '立项率',
        type: 'bar',
        barWidth: 10,
        // label: {
        //   show: true,
        //   position: 'top'
        // },
        itemStyle: {
          color: '#01b998',
          borderRadius: [2, 2, 0, 0]
        },
        data: []
      },
      {
        name: '完成率',
        type: 'bar',
        barWidth: 10,
        // label: {
        //   show: true,
        //   position: 'top'
        // },
        itemStyle: {
          color: '#f4a05d',
          borderRadius: [2, 2, 0, 0]
        },
        data: []
      },
      {
        name: '省平均分解率',
        type: 'line',
        // smooth: true,
        // showAllSymbol: true,
        symbol: 'none',
        symbolSize: 10,
        // label: {
        //   show: true,
        //   position: 'top'
        // },
        itemStyle: {
          color: '#3ba9fd'
        },
        data: []
      },
      {
        name: '省平均立项率',
        type: 'line',
        // smooth: true,
        // showAllSymbol: true,
        symbol: 'none',
        symbolSize: 10,
        // label: {
        //   show: true,
        //   position: 'top'
        // },
        itemStyle: {
          color: '#01b998'
        },
        data: []
      },
      {
        name: '省平均完成率',
        type: 'line',
        // smooth: true,
        // showAllSymbol: true,
        symbol: 'none',
        symbolSize: 10,
        // label: {
        //   show: true,
        //   position: 'top'
        // },
        itemStyle: {
          color: '#f4a05d'
        },
        data: []
      }
    ]
  })

  return {
    bmOBarOptions,
    barLoadingOptions
  }
}
