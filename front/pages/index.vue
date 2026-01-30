<template>
  <Header v-bind:user="currentUser"/>

  <!-- 搜索框 -->
  <div class="search-container px-4 py-3 mb-2">
    <div class="flex gap-2">
      <UInput
        v-model="searchKeyword"
        placeholder="搜索动态内容..."
        size="lg"
        icon="i-heroicons-magnifying-glass"
        :ui="{ icon: { trailing: { pointer: '' } } }"
        class="flex-1"
        @keyup.enter="handleSearch"
      >
        <template #trailing>
          <UButton
            v-show="searchKeyword !== ''"
            color="gray"
            variant="link"
            icon="i-heroicons-x-mark-20-solid"
            :padded="false"
            @click="clearSearch"
          />
        </template>
      </UInput>
      <UButton
        icon="i-heroicons-magnifying-glass"
        size="lg"
        color="primary"
        @click="handleSearch"
      >
        搜索
      </UButton>
    </div>
    <div v-if="isSearching" class="mt-2 text-xs text-gray-500">
      搜索结果：共 {{ searchResultCount }} 条
      <UButton
        variant="link"
        size="xs"
        @click="clearSearch"
        class="ml-2"
      >
        清除搜索
      </UButton>
    </div>
  </div>

  <div class="flex flex-col divide-y divide-[#C0BEBF]/20 ">
    <Memo v-bind:memo="m" v-for="m in memos" :key="m.id" />
  </div>
  <div ref="loadMoreEle" class="text-xs text-center text-gray-500 py-2 cursor-pointer" @click="loadMore" v-if="hasNext">点击加载更多</div>
  <div class="text-xs text-center text-gray-500 py-2" v-else>已经到底啦</div>
</template>

<script setup lang="ts">
import type {MemoVO, SysConfigVO, UserVO} from "~/types";
import Memo from "~/components/Memo.vue";
import {memoChangedEvent, memoReloadEvent} from "~/event";
import {useElementVisibility} from '@vueuse/core'

const currentUser = useState<UserVO>('userinfo')
const sysConfig = useState<SysConfigVO>('sysConfig')

const loadMoreEle = ref(null)
const targetIsVisible = useElementVisibility(loadMoreEle)
watch(targetIsVisible, async (visible) => {
  if (visible && sysConfig.value.enableAutoLoadNextPage) {
    await loadMore()
  }
})
const hasNext = ref(false)
const state = reactive({
  page: 1,
  size: 10,
  contentContains: '',
})

// 搜索相关状态
const searchKeyword = ref('')
const isSearching = ref(false)
const searchResultCount = ref(0)

const memos = ref<Array<MemoVO>>([])
onMounted(async () => {
  await reload()
})

const reload = async () => {
  state.page = 1
  const res = await useMyFetch<{
    list: Array<MemoVO>,
    total: number,
    hasNext: boolean
  }>('/memo/list', state)
  memos.value = res.list
  hasNext.value = res.hasNext
  if (isSearching.value) {
    searchResultCount.value = res.total
  }
}

const loadMore = async () => {
  state.page = state.page + 1
  const res = await useMyFetch<{
    list: Array<MemoVO>,
    total: number,
    hasNext: boolean
  }>('/memo/list', state)
  memos.value = [...memos.value, ...res.list]
  hasNext.value = res.hasNext
}

// 搜索功能
const handleSearch = async () => {
  if (searchKeyword.value.trim() === '') {
    return
  }
  state.contentContains = searchKeyword.value.trim()
  isSearching.value = true
  await reload()
}

// 清除搜索
const clearSearch = async () => {
  searchKeyword.value = ''
  state.contentContains = ''
  isSearching.value = false
  searchResultCount.value = 0
  await reload()
}

memoReloadEvent.on(async () => {
  await reload()
})

memoChangedEvent.on(async (id: number) => {
  const res = await useMyFetch<MemoVO>('/memo/get?latest=1&id=' + id)
  const index = memos.value.findIndex(r => r.id === id)
  if (index >= 0) {
    memos.value[index] = res
  }
})
</script>

<style scoped>

</style>