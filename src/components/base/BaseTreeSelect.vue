<script lang="ts">
import {defineComponent, nextTick, ref, watch} from "vue";

export default defineComponent({
  name:"BaseTreeSelect",
  props:{
    modelValue:{
      type:[String,Number,Array,Object],
      default:""
    },
    data:{
      type:Array,
      default:()=>[]
    },
    props:{
      type:Object,
      default:()=>({
        children:'children',
        label:'label',
        value:'value'
      })
    },
    nodeKey:{
      type:String,
      default:"value"
    },
    multiple:{
      type: Boolean,
      default: false
    },
    disabled:{
      type: Boolean,
      default: false
    },
    clearable:{
      type: Boolean,
      default: false
    },
    collapseTags:{
      type: Boolean,
      default: false
    },
    placeholder:{
      type: String,
      default: "请选择"
    },
    checkStrictly:{
      type: Boolean,
      default: false
    },
    defaultExpandedKeys:{
      type: Array,
      default:()=>[]
    },
    defaultCheckedKeys:{
      type: Array,
      default:()=>[]
    },
    onlyLeaf:{
      type: Boolean,
      default: false
    },
    returnObject:{
      type: Boolean,
      default: false
    },
    remote:{
      type:Boolean,
      default: false
    },
    lazy:{
      type:Boolean,
      default: false
    },
    loadMethod:{
      type:Function,
      default: null
    }
  },
  emits:["update:modelValue",'change','clear','node-click'],
  setup(props,{emit}){
    const treeRef = ref();
    const selectedLabel = ref('');
    const selectedValue = ref(props.modelValue);

    watch(() => props.modelValue, (val) => {
      selectedValue.value = val;
      if (props.multiple) {
        nextTick(() => {
          if (treeRef.value) {
            treeRef.value.setCheckedKeys(val || []);
          }
        });
      } else {
        nextTick(() => {
          if (treeRef.value && val) {
            treeRef.value.setCurrentKey(val);
          }
        });
      }
    }, {
      immediate: true
    });

    const filterNode = (value,data)=>{
      if(!value) return true;
      const label = data[props.props['label']] || "";
      return label.toString().toLowerCase().includes(value.toLowerCase());
    }

    const handleSelectChange = (val)=>{
    }

    const handleClear = ()=>{
      if(props.multiple){
        treeRef.value.setCheckedKeys([]);
      }else{
        treeRef.value.setCurrentKey(null);
      }
      emit("update:modelValue", props.multiple ? [] : "");
      emit("clear");
    };

    const handleCheckChange = ()=>{
      if(!props.multiple)return;
      let checkedNodes = treeRef.value.getCheckedNodes(props.onlyLeaf);
      let checkedKeys = checkedNodes.map(node => props.returnObject ? node : node[props.nodeKey]);
      emit('update:modelValue', checkedKeys);
      emit('change',checkedKeys);
    }

    const handleNodeClick = (data)=> {
      if(!props.multiple)return;
      const value = props.returnObject ? data : data[props.nodeKey];
      emit("update:modelValue", value);
      emit("change",value);
      emit("node-click",data);
    }

    const methods = {
      clearSelected() {
        handleClear();
      },
      getCheckedNodes(){
        return treeRef.value.getCheckedNodes();
      },
      getCheckedKeys(){
        return treeRef.value.getCheckedKeys();
      },
      filter(val){
        treeRef.value.filter(val);
      }
    };

    const handleRemoteMethod = (query)=>{
      if(props.remote){
        emit("search",query);
      }else{
        treeRef.value.filter(query);
      }
    };

    const loadNode = (node,resolve)=>{
      if(props.lazy && props.loadMethod){
        props.loadMethod(node,resolve);
      }else{
        resolve([]);
      }
    };

    return {
      treeRef,
      selectedLabel,
      selectedValue,
      filterNode,
      handleSelectChange,
      handleClear,
      handleCheckChange,
      handleNodeClick,
      loadNode,
      handleRemoteMethod,
      ...methods
    }
  }
})
</script>

<template>
  <el-select v-model="modelValue"></el-select>
</template>

<style scoped lang="less">
.tree-select {
  width: 100%;
  :deep(.el-select-dropdown__wrap){
    max-height: 400px;
  }
  :deep(.el-select-dropdown__item) {
    padding: 0 !important;
    height: auto;
    overflow: visible;
  }

  :deep(.el-select-dropdown__item.hover),
  :deep(.el-select-dropdown__item:hover) {
    background-color: transparent;
  }

  :deep(.el-tree) {
    padding: 5px 0 !important;
    max-height: 300px;
    overflow-y: auto;
  }

  :deep(.el-tree-node__content){
    height: 34px;
    line-height: 34px;
  }

  :deep(.el-tree-node__label){
    font-size: 14px;
  }
}

</style>
