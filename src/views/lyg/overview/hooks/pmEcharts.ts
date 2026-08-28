import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

export const createGauge = (dom: any, rate: number, color: string, title: string): echarts.ECharts => {
  const myChart = echarts.init(dom)
  const option: any = {
    title: {
      text: title,
      left: '5%',
      // top: '5%',
      textStyle: {
        fontSize: 12,
        color: '#333'
      }
    },
    series: [
      {
        type: 'liquidFill',
        radius: '90%',
        center: ['50%', '50%'],
        color: [
          {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: '#fff'
              },
              {
                offset: 1,
                color: color
              }
            ],
            globalCoord: false
          }
        ],
        data: [rate, rate + 0.01], // data个数代表波浪数
        backgroundStyle: {
          borderWidth: 1,
          color: 'white'
        },
        label: {
          normal: {
            textStyle: {
              fontSize: 14,
              color: 'red'
            },
            formatter: function (params: any) {
              return params.value * 100 + '%'
            }
          }
        },
        outline: {
          borderDistance: 0,
          itemStyle: {
            borderWidth: 0,
            borderColor: '#fff'
          }
        }
      }
    ]
  }
  myChart.setOption(option)
  return myChart
}

export const createPie = (dom: any, data: any[], title: string): echarts.ECharts => {
  const myChart = echarts.init(dom)
  const option: any = {
    title: {
      text: title,
      left: '5%',
      top: '5%',
      textStyle: {
        fontSize: 14,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}'
    },
    legend: {
      orient: 'vertical',
      right: '10%',
      height: '65%',
      align: 'left',
      top: 'bottom',
      textStyle: {
        fontSize: 12,
        color: '#8c8c8c'
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '70%'], // 环形饼图，如果想实心饼图改为 ['0%', '70%']
        center: ['17%', '60%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          fontSize: 12,
          formatter: '{b}\n{d}%'
        },
        emphasis: {
          label: {
            show: false,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false,
          length: 10,
          length2: 15
        },
        data: data
      }
    ]
  }
  myChart.setOption(option)
  myChart.resize()
  return myChart
}
