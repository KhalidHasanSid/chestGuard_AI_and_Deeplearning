import { createBrowserRouter, RouterProvider, Route, createRoutesFromElements } from 'react-router-dom';  // Import createRoutesFromElements
import Registration from './Registration.jsx';
import Login from './login.jsx';
import Protected from './protected.jsx';
import Layout from './layout.jsx';
import Home from './home.jsx';
import Detection from './admin/detection.jsx';
import AskQuestion from './askQuestion.jsx';
import Faqs from './faqs.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import AdminRegistration from './admin/adminRegistration.jsx';
import AdminLogin from './admin/AdminLogin.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import ForgetPassword from './admin/forgetPassword.jsx';
import AdminProtected from './admin/adminProtected.jsx';
import CheckQuestion from './admin/checkQuestion.jsx';
import NewPatient from './admin/NewPatient.jsx';
import SendEmail from './admin/sendEmail.jsx';
import Result from './Result.jsx';
import Articles from './articlesandresearch.jsx';
import Doctor from './Doctor.js';

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* Public Routes */}
        <Route path="/Adminregistration" element={<AdminRegistration/>} />
        <Route path="/Adminlogin" element={<AdminLogin />} />
        <Route path="/forgetpassword" element={<ForgetPassword />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/forgetpassword" element={<ForgetPassword />} />

        <Route path="/" element={<Protected><Layout /></Protected>}>
          <Route path="home" element={<Home />} />
          <Route path="Doctor" element={<Doctor />} />
          <Route path="result" element={<Result />} />
          <Route path="askQuestion" element={<AskQuestion />} />
          <Route path="faqs" element={<Faqs />} />
          <Route path="articles" element={<Articles />} />
        </Route>

        <Route path="/" element={<AdminProtected><AdminLayout /></AdminProtected>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="detection" element={<Detection />} />
          <Route path="newPatient" element={<NewPatient />} />
          <Route path="sendEmail" element={<SendEmail />} />
          <Route path="checkquestion" element={<CheckQuestion />} />
        </Route>
      </>
    )
  );

  return <RouterProvider router={router} />;
}

export default App;
