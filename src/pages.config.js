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
import AdminBadges from './pages/AdminBadges';
import AdminDashboard from './pages/AdminDashboard';
import AdminGrantBadge from './pages/AdminGrantBadge';
import AdminLandingConfig from './pages/AdminLandingConfig';
import AdminUsers from './pages/AdminUsers';
import BadgeCollection from './pages/BadgeCollection';
import BadgeDetail from './pages/BadgeDetail';
import ClubHub from './pages/ClubHub';
import Dashboard from './pages/Dashboard';
import EditProfile from './pages/EditProfile';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import SearchProfiles from './pages/SearchProfiles';
import __Layout from './Layout.jsx';

export const PAGES = {
    "AdminBadges": AdminBadges,
    "AdminDashboard": AdminDashboard,
    "AdminGrantBadge": AdminGrantBadge,
    "AdminLandingConfig": AdminLandingConfig,
    "AdminUsers": AdminUsers,
    "BadgeCollection": BadgeCollection,
    "BadgeDetail": BadgeDetail,
    "ClubHub": ClubHub,
    "Dashboard": Dashboard,
    "EditProfile": EditProfile,
    "Landing": Landing,
    "Profile": Profile,
    "PublicProfile": PublicProfile,
    "SearchProfiles": SearchProfiles,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};