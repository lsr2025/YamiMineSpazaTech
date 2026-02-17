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
import AgentProfile from './pages/AgentProfile';
import Analytics from './pages/Analytics';
import AttendanceTracking from './pages/AttendanceTracking';
import Dashboard from './pages/Dashboard';
import HRDashboard from './pages/HRDashboard';
import Home from './pages/Home';
import LeaveManagement from './pages/LeaveManagement';
import MapView from './pages/MapView';
import NewInspection from './pages/NewInspection';
import NewShop from './pages/NewShop';
import ShiftManagement from './pages/ShiftManagement';
import ShopDetail from './pages/ShopDetail';
import Shops from './pages/Shops';
import SuperDashboard from './pages/SuperDashboard';
import MobileCheckIn from './pages/MobileCheckIn';
import MobileLeave from './pages/MobileLeave';
import MySchedule from './pages/MySchedule';
import MyProfile from './pages/MyProfile';
import MobileSupervisor from './pages/MobileSupervisor';
import OnboardingChecklist from './pages/OnboardingChecklist';
import OnboardingManagement from './pages/OnboardingManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentProfile": AgentProfile,
    "Analytics": Analytics,
    "AttendanceTracking": AttendanceTracking,
    "Dashboard": Dashboard,
    "HRDashboard": HRDashboard,
    "Home": Home,
    "LeaveManagement": LeaveManagement,
    "MapView": MapView,
    "NewInspection": NewInspection,
    "NewShop": NewShop,
    "ShiftManagement": ShiftManagement,
    "ShopDetail": ShopDetail,
    "Shops": Shops,
    "SuperDashboard": SuperDashboard,
    "MobileCheckIn": MobileCheckIn,
    "MobileLeave": MobileLeave,
    "MySchedule": MySchedule,
    "MyProfile": MyProfile,
    "MobileSupervisor": MobileSupervisor,
    "OnboardingChecklist": OnboardingChecklist,
    "OnboardingManagement": OnboardingManagement,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};