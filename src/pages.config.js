/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminPanel from './pages/AdminPanel';
import AgentPerformanceReports from './pages/AgentPerformanceReports';
import AgentProfile from './pages/AgentProfile';
import Analytics from './pages/Analytics';
import AttendanceTracking from './pages/AttendanceTracking';
import BulkImportAgents from './pages/BulkImportAgents';
import Dashboard from './pages/Dashboard';
import Guardrails from './pages/Guardrails';
import HRDashboard from './pages/HRDashboard';
import Home from './pages/Home';
import LeaveManagement from './pages/LeaveManagement';
import MapView from './pages/MapView';
import MobileCheckIn from './pages/MobileCheckIn';
import MobileLeave from './pages/MobileLeave';
import MobileSupervisor from './pages/MobileSupervisor';
import MyProfile from './pages/MyProfile';
import MySchedule from './pages/MySchedule';
import NewAgent from './pages/NewAgent';
import NewInspection from './pages/NewInspection';
import NewShop from './pages/NewShop';
import OnboardingChecklist from './pages/OnboardingChecklist';
import OnboardingManagement from './pages/OnboardingManagement';
import ShiftManagement from './pages/ShiftManagement';
import ShopDetail from './pages/ShopDetail';
import Shops from './pages/Shops';
import SuperDashboard from './pages/SuperDashboard';
import TaskAssignment from './pages/TaskAssignment';
import TaskMonitoring from './pages/TaskMonitoring';
import TeamManagement from './pages/TeamManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminPanel": AdminPanel,
    "AgentPerformanceReports": AgentPerformanceReports,
    "AgentProfile": AgentProfile,
    "Analytics": Analytics,
    "AttendanceTracking": AttendanceTracking,
    "BulkImportAgents": BulkImportAgents,
    "Dashboard": Dashboard,
    "Guardrails": Guardrails,
    "HRDashboard": HRDashboard,
    "Home": Home,
    "LeaveManagement": LeaveManagement,
    "MapView": MapView,
    "MobileCheckIn": MobileCheckIn,
    "MobileLeave": MobileLeave,
    "MobileSupervisor": MobileSupervisor,
    "MyProfile": MyProfile,
    "MySchedule": MySchedule,
    "NewAgent": NewAgent,
    "NewInspection": NewInspection,
    "NewShop": NewShop,
    "OnboardingChecklist": OnboardingChecklist,
    "OnboardingManagement": OnboardingManagement,
    "ShiftManagement": ShiftManagement,
    "ShopDetail": ShopDetail,
    "Shops": Shops,
    "SuperDashboard": SuperDashboard,
    "TaskAssignment": TaskAssignment,
    "TaskMonitoring": TaskMonitoring,
    "TeamManagement": TeamManagement,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};