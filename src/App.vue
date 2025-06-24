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
              <template #checked>🌙</template>
              <template #unchecked>☀️</template>
            </n-switch>
            <n-button text @click="openGithub">
              <template #icon>
                <n-icon
                  ><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                      fill="currentColor"
                    /></svg
                ></n-icon>
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
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
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
    icon: () => "🔄",
  },
  {
    label: "操作符演示",
    key: "Operators",
    icon: () => "⚡",
  },
  {
    label: "流组合演示",
    key: "StreamCombination",
    icon: () => "🔗",
  },
  {
    label: "错误处理演示",
    key: "ErrorHandling",
    icon: () => "🛡️",
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
