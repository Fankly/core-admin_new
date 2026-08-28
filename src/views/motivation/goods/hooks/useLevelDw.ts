import { computed, ref, watch } from 'vue';
import { getEjdwData, getYjdwData } from "@/api/service/expertinformation";
interface LevelUnitItem {
    id: any;
    name: string;
    code: any;
}
export const useLevelDw = () => {
    const levelOne = ref<LevelUnitItem[]>([]);
    const levelTwo = ref<LevelUnitItem[]>([]);
    const getLevelOne = async () => {
        levelOne.value.length = 0; //清空单位
        // 一级单位
        const res = await getYjdwData();
        if (res.success && res.data.length != 0) {
            levelOne.value.push(...res.data);
        }
    }
    const getLevelTwo = async (id: any, flag?: boolean) => {
        const res = await getEjdwData(id);
        if (flag) {
            return res;
        }
        levelTwo.value.length = 0; // 清空单位
        if (res.success && res.data.length !== 0) {
            levelTwo.value.push(...res.data);
        }
    }
    return {
        levelOne,
        levelTwo,
        getLevelOne,
        getLevelTwo
    }
}