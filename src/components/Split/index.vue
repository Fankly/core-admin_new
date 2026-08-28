<script lang="ts" setup>
import { ref } from 'vue'

// types
export interface Props {
  horizontal?: boolean
  ratio?: string
}

// varibles
const props = withDefaults(defineProps<Props>(), {
  horizontal: false
})

const one = ref<HTMLElement>()
const two = ref<HTMLElement>()
const [initGrow1, initGrow2] = parseRatio(props.ratio as string)

// states
const grow1 = ref(initGrow1)
const grow2 = ref(initGrow2)

// methods
function parseRatio(ratio: string): [number, number] {
  // ratio: strings like "1/2"
  const rn = ratio
    ?.split('/')
    ?.map(Number)
    ?.filter((val) => !isNaN(val))

  if (!rn || rn.length !== 2) {
    return [1, 1]
  }

  return rn as [number, number]
}

function startResize(mde: MouseEvent) {
  one.value?.classList.add('forbid-select')
  two.value?.classList.add('forbid-select')

  const initialPos = props.horizontal ? mde.clientY : mde?.clientX
  const sizeOne = props.horizontal ? one?.value?.offsetHeight : one?.value?.offsetWidth
  const sizeTwo = props.horizontal ? two?.value?.offsetHeight : two?.value?.offsetWidth

  function handleMouseMove(mme: MouseEvent) {
    // forbid select

    let pos = props.horizontal ? mme.clientY : mme?.clientX
    let newSizeOne = sizeOne! + pos - initialPos

    const totalGrow = grow1.value + grow2.value
    grow1.value = totalGrow * (newSizeOne / (sizeOne! + sizeTwo!))
    grow2.value = totalGrow - grow1.value
  }

  function handleMouseUp(mue: MouseEvent) {
    one.value?.classList.remove('forbid-select')
    two.value?.classList.remove('forbid-select')

    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>

<template>
  <div class="split" :class="{ horizontal }">
    <div class="sub" ref="one" :style="{ flexGrow: grow1 }">
      <slot name="one"></slot>
    </div>
    <div class="resizer" @mousedown="startResize"></div>
    <div class="sub" ref="two" :style="{ flexGrow: grow2 }">
      <slot name="two"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.forbid-select {
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.split {
  width: 100%;
  height: 100%;
  display: flex;

  .sub {
    padding: 10px;
  }

  .resizer {
    width: 5px;
    background-color: #ddd;
    cursor: w-resize;
    transition: 0.3s;

    &:hover {
      background-color: #999;
    }
  }

  .sub {
    padding: 10px;
    width: 100%;
    height: 100%;
    flex-grow: 1;
    flex-basis: 0%;
    align-items: stretch;
    align-content: stretch;

    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background-color: #fff;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #666;
    }

    scrollbar-width: thin;
  }

  &.horizontal {
    flex-direction: column;

    .resizer {
      height: 5px;
      width: 100%;
      cursor: n-resize;
    }
  }
}
</style>
