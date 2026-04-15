import { Authenticated, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { MuiInferencer } from "@refinedev/inferencer/mui";

import "./App.css";
import { ErrorComponent } from "./components/refine-ui/layout/error-component";
import { Layout } from "./components/refine-ui/layout/layout";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import { DashboardPage } from "./pages/dashboard";

import { authProvider } from "./authProvider";
import { dataProvider } from "./providers/data";

import { Login } from "./pages/login";
import { Register } from "./pages/register";
import { ForgotPassword } from "./pages/forgot-password";

import { UserChallengesList } from "./pages/user-challenges/list";
import { AppUsersList } from "./pages/app-users/list";
import { ExercisesList } from "./pages/exercises/list";
import { ChallengesList } from "./pages/challenges/list";
import { BadgesList } from "./pages/badges/list";
import { AiSuggestionsList } from "./pages/ai-suggestions/list";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <DevtoolsProvider>
            <Refine
              dataProvider={dataProvider}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              authProvider={authProvider}
              resources={[
                {
                  name: "dashboard",
                  list: "/",
                  meta: { label: "Bảng điều khiển" },
                },
                {
                  name: "app_users",
                  list: "/app-users",
                  create: "/app-users/create",
                  edit: "/app-users/edit/:id",
                  show: "/app-users/show/:id",
                  meta: { label: "Quản lý Người dùng" },
                },
                {
                  name: "exercises",
                  list: "/exercises",
                  create: "/exercises/create",
                  edit: "/exercises/edit/:id",
                  show: "/exercises/show/:id",
                  meta: { label: "Bài Tập" },
                },
                {
                  name: "challenges",
                  list: "/challenges",
                  create: "/challenges/create",
                  edit: "/challenges/edit/:id",
                  show: "/challenges/show/:id",
                  meta: { label: "Thử Thách" },
                },
                {
                  name: "badges",
                  list: "/badges",
                  create: "/badges/create",
                  edit: "/badges/edit/:id",
                  show: "/badges/show/:id",
                  meta: { label: "Huy Hiệu" },
                },
                {
                  name: "user-challenges",
                  list: "/user-challenges",
                  create: "/user-challenges/create",
                  edit: "/user-challenges/edit/:id",
                  show: "/user-challenges/show/:id",
                  meta: { label: "Thử Thách Của User" },
                },
                {
                  name: "ai-suggestions",
                  list: "/ai-suggestions",
                  create: "/ai-suggestions/create",
                  edit: "/ai-suggestions/edit/:id",
                  show: "/ai-suggestions/show/:id",
                  meta: { label: "Gợi Ý AI" },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "spvv4L-GcdaKw-Rok9ty",
              }}
            >
              <Routes>
                <Route
                  element={
                    <Authenticated
                      key="authenticated-inner"
                      fallback={<CatchAllNavigate to="/login" />}
                    >
                      <Layout>
                        <Outlet />
                      </Layout>
                    </Authenticated>
                  }
                >
                  <Route index element={<DashboardPage />} />

                  <Route path="/app-users">
                    <Route index element={<AppUsersList />} />
                    <Route path="create" element={<MuiInferencer />} />
                    <Route path="edit/:id" element={<MuiInferencer />} />
                    <Route path="show/:id" element={<MuiInferencer />} />
                  </Route>

                  <Route path="/exercises">
                    <Route index element={<ExercisesList />} />
                    <Route path="create" element={<MuiInferencer />} />
                    <Route path="edit/:id" element={<MuiInferencer />} />
                    <Route path="show/:id" element={<MuiInferencer />} />
                  </Route>

                  <Route path="/challenges">
                    <Route index element={<ChallengesList />} />
                    <Route path="create" element={<MuiInferencer />} />
                    <Route path="edit/:id" element={<MuiInferencer />} />
                    <Route path="show/:id" element={<MuiInferencer />} />
                  </Route>

                  <Route path="/badges">
                    <Route index element={<BadgesList />} />
                    <Route path="create" element={<MuiInferencer />} />
                    <Route path="edit/:id" element={<MuiInferencer />} />
                    <Route path="show/:id" element={<MuiInferencer />} />
                  </Route>

                  <Route path="/user-challenges">
                    <Route index element={<UserChallengesList />} />
                    <Route
                      path="edit/:id"
                      element={<MuiInferencer hideCodeViewerInProduction />}
                    />
                    <Route
                      path="show/:id"
                      element={<MuiInferencer hideCodeViewerInProduction />}
                    />
                  </Route>

                  <Route path="/ai-suggestions">
                    <Route index element={<AiSuggestionsList />} />
                    <Route path="create" element={<MuiInferencer />} />
                    <Route path="edit/:id" element={<MuiInferencer />} />
                    <Route path="show/:id" element={<MuiInferencer />} />
                  </Route>

                  <Route path="*" element={<ErrorComponent />} />
                </Route>

                <Route
                  element={
                    <Authenticated
                      key="authenticated-outer"
                      fallback={<Outlet />}
                    >
                      <NavigateToResource resource="dashboard" />
                    </Authenticated>
                  }
                >
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>
              </Routes>

              <Toaster />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>

            <DevtoolsPanel />
          </DevtoolsProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
