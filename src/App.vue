<template>
  <n-config-provider :theme="isDark ? darkTheme : undefined">
    <n-layout has-sider style="height: 100vh">
      <!-- 侧边菜单 -->
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="280"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
      >
        <div class="logo-container">
          <n-h2 v-if="!collapsed">🚀 FastRx 演示</n-h2>
          <n-h2 v-else>🚀</n-h2>
        </div>

        <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="20"
          :options="menuOptions"
          :value="String($route.name)"
          @update:value="handleMenuSelect"
        />
      </n-layout-sider>

      <!-- 主内容区域 -->
      <n-layout>
        <!-- 顶部工具栏 -->
        <n-layout-header
          bordered
          style="
            height: 64px;
            padding: 0 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          "
        >
          <n-h3 style="margin: 0">{{ currentPageTitle }}</n-h3>
          <n-space>
            <n-switch v-model:value="isDark" @update:value="toggleTheme">
              <template #checked>
                <Icon icon="mdi:weather-night" />
              </template>
              <template #unchecked>
                <Icon icon="mdi:weather-sunny" />
              </template>
            </n-switch>
            <n-button text @click="openGithub">
              <template #icon>
                <Icon icon="mdi:github" />
              </template>
            </n-button>
          </n-space>
        </n-layout-header>

        <!-- 内容区域 -->
        <n-layout-content style="padding: 24px; overflow: auto">
          <router-view />
        </n-layout-content>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, h } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import {
  NConfigProvider,
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NH2,
  NH3,
  NSpace,
  NSwitch,
  NButton,
  NIcon,
  darkTheme,
  type MenuOption,
} from "naive-ui";

const router = useRouter();
const route = useRoute();

const collapsed = ref(false);
const isDark = ref(false);

const menuOptions: MenuOption[] = [
  {
    label: "重试逻辑演示",
    key: "RetryLogic",
    icon: () => h(Icon, { icon: "mdi:refresh" }),
  },
  {
    label: "操作符演示",
    key: "Operators",
    icon: () => h(Icon, { icon: "mdi:lightning-bolt" }),
  },
  {
    label: "流组合演示",
    key: "StreamCombination",
    icon: () => h(Icon, { icon: "mdi:link-variant" }),
  },
  {
    label: "错误处理演示",
    key: "ErrorHandling",
    icon: () => h(Icon, { icon: "mdi:shield-check" }),
  },
  {
    label: "重连逻辑演示",
    key: "Reconnect",
    icon: () => h(Icon, { icon: "mdi:connection" }),
  },
];

const currentPageTitle = computed(() => {
  return (route.meta?.title as string) || "演示";
});

const handleMenuSelect = (key: string) => {
  router.push({ name: key });
};

const toggleTheme = () => {
  // 主题切换逻辑
};

const openGithub = () => {
  window.open("https://github.com/langhuihui/fastrx", "_blank");
};
</script>

<style scoped>
.logo-container {
  padding: 24px 16px;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}

.logo-container h2 {
  margin: 0;
  color: var(--primary-color);
}
</style>
