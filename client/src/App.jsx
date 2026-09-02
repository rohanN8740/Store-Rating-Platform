import { useEffect, useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import {
  adminAPI,
  authAPI,
  ratingAPI,
  storeAPI,
  userAPI,
} from "./services/api";
import { useAuth } from "./context/AuthContext";

const authDefaults = { name: "", email: "", password: "", address: "" };

function Stars({ value = 0 }) {
  const rounded = Math.round(Number(value));
  return (
    <span
      className="stars"
      aria-label={`${Number(value).toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span className={star <= rounded ? "star filled" : "star"} key={star}>
          ★
        </span>
      ))}
    </span>
  );
}

function Logo() {
  return (
    <span className="logo-mark" aria-label="StoreScore logo">
      ✓
    </span>
  );
}

function PasswordInput({ value, onChange, required = false }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        required={required}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible(!visible)}
      >
        {visible ? "◉" : "◌"}
      </button>
    </div>
  );
}

function Layout({ children }) {
  const { user, isAuthenticated, isAdmin, isStoreOwner, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/">
          <Logo />
          <span>StoreScore</span>
        </NavLink>
        <nav className="main-nav">
          <NavLink className="nav-link" to="/" end>
            Discover
          </NavLink>
          <NavLink className="nav-link" to="/stores">
            Listed Stores
          </NavLink>
          {isAuthenticated && (
            <NavLink className="nav-link" to="/profile">
              Profile
            </NavLink>
          )}
          {isAdmin && (
            <NavLink className="nav-link" to="/admin">
              Admin
            </NavLink>
          )}
          {isStoreOwner && (
            <NavLink className="nav-link" to="/owner">
              My Store
            </NavLink>
          )}
        </nav>
        <div className="account-actions">
          {isAuthenticated ? (
            <>
              <span className="user-label">{user.name}</span>
              <button className="button secondary" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <NavLink className="button primary" to="/login">
              Sign in
            </NavLink>
          )}
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="footer-brand">
          <Logo />
          <div>
            <strong>StoreScore</strong>
            <p>Community feedback for better local decisions.</p>
          </div>
        </div>
        <div className="footer-links">
          <strong>Navigation</strong>
          <NavLink to="/">Discover stores</NavLink>
          <NavLink to="/stores">Listed stores</NavLink>
          {isAuthenticated ? (
            <NavLink to="/profile">My profile</NavLink>
          ) : (
            <NavLink to="/login">Sign in</NavLink>
          )}
        </div>
        <div className="footer-links">
          <strong>Account</strong>
          {isAdmin && <NavLink to="/admin">Admin dashboard</NavLink>}
          {isStoreOwner && <NavLink to="/owner">Owner dashboard</NavLink>}
          <span>© 2026 StoreScore</span>
        </div>
      </footer>
    </div>
  );
}

function AuthPage({ mode }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(authDefaults);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = isLogin
        ? await authAPI.login(form.email, form.password)
        : await authAPI.signup(
            form.name,
            form.email,
            form.password,
            form.address,
          );
      login(result.data.user, result.data.token);
      navigate("/");
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "The request could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-page">
      <section className="form-card">
        <h1>{isLogin ? "Sign in" : "Create an account"}</h1>
        <p className="subtle">
          {isLogin
            ? "Access your ratings and profile."
            : "Register as a store rating user."}
        </p>
        <form onSubmit={submit}>
          {!isLogin && (
            <>
              <label>
                Full name
                <input
                  required
                  minLength="20"
                  maxLength="60"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Address
                <textarea
                  required
                  maxLength="400"
                  rows="3"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </label>
            </>
          )}
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <PasswordInput
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          {error && <p className="message error">{error}</p>}
          <button className="button primary full" disabled={busy}>
            {busy ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="form-switch">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <NavLink to={isLogin ? "/signup" : "/login"}>
            {isLogin ? "Create an account" : "Sign in"}
          </NavLink>
        </p>
      </section>
    </main>
  );
}

function StoreCard({ store, onRate }) {
  return (
    <article className="store-card">
      <div className="card-heading">
        <span className="store-initial">
          {store.name.charAt(0).toUpperCase()}
        </span>
        <span className="rating-summary">
          <strong>{Number(store.avg_rating).toFixed(1)}</strong>{" "}
          <Stars value={store.avg_rating} />
        </span>
      </div>
      <h2>{store.name}</h2>
      <p className="subtle address">{store.address}</p>
      <p className="rating-count">
        {store.total_ratings}{" "}
        {Number(store.total_ratings) === 1 ? "rating" : "ratings"}
      </p>
      <div className="rate-row">
        <span>Rate this place</span>
        <div className="rate-buttons">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              title={`Rate ${value} out of 5`}
              onClick={() => onRate(store.id, value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function DirectoryGuide() {
  return (
    <section className="getting-started">
      <div>
        <h2>How the directory works</h2>
        <p className="subtle">
          A simple way to compare stores using feedback from the platform.
        </p>
      </div>
      <div className="guide-items">
        <article>
          <span>01</span>
          <h3>Find a store</h3>
          <p className="subtle">
            Search by name or location to narrow the directory.
          </p>
        </article>
        <article>
          <span>02</span>
          <h3>Check the score</h3>
          <p className="subtle">
            See the average rating and number of submitted ratings.
          </p>
        </article>
        <article>
          <span>03</span>
          <h3>Share your view</h3>
          <p className="subtle">Sign in and choose a score from one to five.</p>
        </article>
      </div>
    </section>
  );
}

function Discover({
  title = "Discover Stores",
  subtitle = "Browse stores and see ratings from users.",
}) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const [address, setAddress] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setLoading(true);
    storeAPI
      .listStores({
        name: search || undefined,
        address: address || undefined,
        sortBy,
        order,
      })
      .then((result) => setStores(result.data))
      .catch(() =>
        setMessage("Unable to load stores. Check that the backend is running."),
      )
      .finally(() => setLoading(false));
  }, [search, address, sortBy, order]);
  const rate = async (storeId, value) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      await ratingAPI.submitRating(storeId, value);
      setMessage("Rating submitted successfully.");
    } catch (error) {
      setMessage(error.response?.data?.error || "Unable to submit rating.");
    }
  };
  return (
    <main className="content">
      <section className="page-heading page-heading-row">
        <div>
          <h1>{title}</h1>
          <p className="subtle">{subtitle}</p>
        </div>
        <div className="account-status">
          <span className="status-dot" />
          {isAuthenticated ? `Signed in as ${user.name}` : "Browsing as guest"}
        </div>
      </section>
      <section className="directory-summary">
        <div>
          <span>Stores listed</span>
          <strong>{stores.length}</strong>
        </div>
        <div>
          <span>Total ratings</span>
          <strong>
            {stores.reduce(
              (total, store) => total + Number(store.total_ratings || 0),
              0,
            )}
          </strong>
        </div>
        <div>
          <span>Average score</span>
          <strong>
            {stores.length
              ? (
                  stores.reduce(
                    (total, store) => total + Number(store.avg_rating || 0),
                    0,
                  ) / stores.length
                ).toFixed(1)
              : "0.0"}
            <small> / 5</small>
          </strong>
        </div>
      </section>
      <div className="listing-toolbar">
        <label className="search-box">
          <span>Search stores</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by store name"
          />
        </label>
        <label className="filter-box">
          <span>Location</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address"
          />
        </label>
        <label className="filter-box sort-select">
          <span>Sort by</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Store name</option>
            <option value="address">Address</option>
            <option value="avg_rating">Rating</option>
          </select>
        </label>
        <button
          className="button secondary sort-order"
          onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
          title="Change sort direction"
        >
          {order === "asc" ? "A-Z" : "Z-A"}
        </button>
        <span className="result-label">{stores.length} stores</span>
      </div>
      {message && <p className="message info">{message}</p>}
      <div className="section-heading">
        <h2>Store directory</h2>
        <span className="subtle">
          Select a score from 1 to 5 to submit a rating.
        </span>
      </div>
      <section className="store-grid">
        {loading ? (
          <p className="subtle">Loading stores...</p>
        ) : stores.length ? (
          stores.map((store) => (
            <StoreCard key={store.id} store={store} onRate={rate} />
          ))
        ) : (
          <div className="empty-state">
            <h2>No stores found</h2>
            <p className="subtle">Try another search term.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    storeAPI
      .listStores({ sortBy: "avg_rating", order: "desc" })
      .then((result) => setStores(result.data))
      .catch(() => setMessage("Unable to load the store overview."));
  }, []);

  const rate = async (storeId, value) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      await ratingAPI.submitRating(storeId, value);
      setMessage("Rating submitted successfully.");
    } catch (error) {
      setMessage(error.response?.data?.error || "Unable to submit rating.");
    }
  };

  return (
    <main className="content home-content">
      <section className="home-intro">
        <div>
          <p className="section-label">Store rating platform</p>
          <h1>
            {isAuthenticated
              ? `Welcome back, ${user.name.split(" ")[0]}`
              : "A clearer way to choose local stores"}
          </h1>
          <p className="subtle">
            Compare community ratings, find store information, and share your
            own experience.
          </p>
        </div>
        <NavLink className="button primary" to="/stores">
          Browse all stores
        </NavLink>
      </section>
      <section className="home-stats">
        <div>
          <strong>{stores.length}</strong>
          <span>stores in directory</span>
        </div>
        <div>
          <strong>
            {stores.reduce(
              (total, store) => total + Number(store.total_ratings || 0),
              0,
            )}
          </strong>
          <span>ratings submitted</span>
        </div>
        <div>
          <strong>
            {stores.length
              ? (
                  stores.reduce(
                    (total, store) => total + Number(store.avg_rating || 0),
                    0,
                  ) / stores.length
                ).toFixed(1)
              : "0.0"}
            <small> / 5</small>
          </strong>
          <span>directory average</span>
        </div>
      </section>
      {message && <p className="message info">{message}</p>}
      <section className="home-section">
        <div className="section-heading">
          <div>
            <h2>Highest rated stores</h2>
            <p className="subtle">A quick look at the best current scores.</p>
          </div>
          <NavLink className="inline-link" to="/stores">
            View full directory →
          </NavLink>
        </div>
        <div className="store-grid home-store-grid">
          {stores.slice(0, 3).map((store) => (
            <StoreCard key={store.id} store={store} onRate={rate} />
          ))}
        </div>
        {!stores.length && (
          <p className="subtle">No store ratings are available yet.</p>
        )}
      </section>
      <section className="home-note">
        <div>
          <span className="section-label">For everyone</span>
          <h2>Useful feedback starts with one honest rating.</h2>
        </div>
        <p className="subtle">
          Browse publicly without an account. Sign in when you are ready to rate
          a store or manage your profile.
        </p>
      </section>
      <DirectoryGuide />
    </main>
  );
}

function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  useEffect(() => {
    userAPI
      .getProfile()
      .then((result) => setProfile(result.data))
      .catch(() => setMessage("Unable to load profile."));
  }, []);
  const changePassword = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const result = await userAPI.changePassword(
        form.currentPassword,
        form.newPassword,
      );
      setMessage(result.data.message);
      setForm({ currentPassword: "", newPassword: "" });
    } catch (error) {
      setMessage(error.response?.data?.error || "Unable to change password.");
    }
  };
  return (
    <main className="content narrow">
      <section className="page-heading">
        <h1>My Profile</h1>
        <p className="subtle">
          View your account details and manage your password.
        </p>
      </section>
      <div className="profile-grid">
        <section className="data-panel">
          <h2>Profile information</h2>
          <dl>
            <dt>Name</dt>
            <dd>{profile?.name}</dd>
            <dt>Email</dt>
            <dd>{profile?.email}</dd>
            <dt>Role</dt>
            <dd>
              <span className="role-badge">{profile?.role}</span>
            </dd>
            <dt>Address</dt>
            <dd>{profile?.address || "Not provided"}</dd>
          </dl>
          <button className="button secondary" onClick={logout}>
            Log out
          </button>
        </section>
        <section className="data-panel">
          <h2>Change password</h2>
          <form onSubmit={changePassword}>
            <label>
              Current password
              <PasswordInput
                required
                value={form.currentPassword}
                onChange={(e) =>
                  setForm({ ...form, currentPassword: e.target.value })
                }
              />
            </label>
            <label>
              New password
              <PasswordInput
                required
                value={form.newPassword}
                onChange={(e) =>
                  setForm({ ...form, newPassword: e.target.value })
                }
              />
            </label>
            {message && <p className="message info">{message}</p>}
            <button className="button primary">Update password</button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length}>No records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Admin() {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [message, setMessage] = useState("");
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
    role: "USER",
  });
  const [storeForm, setStoreForm] = useState({
    name: "",
    email: "",
    address: "",
    ownerId: "",
  });
  const load = () => {
    adminAPI.getDashboard().then((result) => setDashboard(result.data));
    adminAPI.listUsers().then((result) => setUsers(result.data));
    adminAPI.listStores().then((result) => setStores(result.data));
  };
  useEffect(load, []);
  const submit = async (event, type) => {
    event.preventDefault();
    try {
      if (type === "user") {
        await adminAPI.createUser(
          userForm.name,
          userForm.email,
          userForm.password,
          userForm.address,
          userForm.role,
        );
        setUserForm({
          name: "",
          email: "",
          password: "",
          address: "",
          role: "USER",
        });
      } else {
        await adminAPI.createStore(
          storeForm.name,
          storeForm.email,
          storeForm.address,
          storeForm.ownerId || null,
        );
        setStoreForm({ name: "", email: "", address: "", ownerId: "" });
      }
      setMessage(`${type === "user" ? "User" : "Store"} created successfully.`);
      load();
    } catch (error) {
      setMessage(error.response?.data?.error || `Unable to create ${type}.`);
    }
  };
  return (
    <main className="content admin-content">
      <section className="page-heading">
        <h1>Admin Dashboard</h1>
        <p className="subtle">Manage platform users, stores, and activity.</p>
      </section>
      <section className="stats-grid">
        {[
          ["Total users", dashboard?.totalUsers],
          ["Total stores", dashboard?.totalStores],
          ["Total ratings", dashboard?.totalRatings],
        ].map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value ?? "-"}</strong>
          </div>
        ))}
      </section>
      {message && <p className="message info">{message}</p>}
      <section className="admin-columns">
        <section className="data-panel">
          <h2>Add user</h2>
          <form onSubmit={(e) => submit(e, "user")}>
            <label>
              Name
              <input
                required
                minLength="20"
                maxLength="60"
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
              />
            </label>
            <label>
              Password
              <PasswordInput
                required
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
              />
            </label>
            <label>
              Address
              <input
                required
                value={userForm.address}
                onChange={(e) =>
                  setUserForm({ ...userForm, address: e.target.value })
                }
              />
            </label>
            <label>
              Role
              <select
                value={userForm.role}
                onChange={(e) =>
                  setUserForm({ ...userForm, role: e.target.value })
                }
              >
                <option>USER</option>
                <option>STORE_OWNER</option>
                <option>ADMIN</option>
              </select>
            </label>
            <button className="button primary">Create user</button>
          </form>
        </section>
        <section className="data-panel">
          <h2>Add store</h2>
          <form onSubmit={(e) => submit(e, "store")}>
            <label>
              Store name
              <input
                required
                minLength="20"
                maxLength="60"
                value={storeForm.name}
                onChange={(e) =>
                  setStoreForm({ ...storeForm, name: e.target.value })
                }
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                value={storeForm.email}
                onChange={(e) =>
                  setStoreForm({ ...storeForm, email: e.target.value })
                }
              />
            </label>
            <label>
              Address
              <input
                required
                value={storeForm.address}
                onChange={(e) =>
                  setStoreForm({ ...storeForm, address: e.target.value })
                }
              />
            </label>
            <label>
              Owner ID
              <input
                value={storeForm.ownerId}
                onChange={(e) =>
                  setStoreForm({ ...storeForm, ownerId: e.target.value })
                }
                placeholder="Optional"
              />
            </label>
            <button className="button primary">Create store</button>
          </form>
        </section>
      </section>
      <section className="table-panel">
        <h2>Users</h2>
        <Table
          headers={["Name", "Email", "Role"]}
          rows={users.map((item) => [item.name, item.email, item.role])}
        />
      </section>
      <section className="table-panel">
        <h2>Stores</h2>
        <Table
          headers={["Name", "Email", "Owner", "Rating"]}
          rows={stores.map((item) => [
            item.name,
            item.email,
            item.owner_name || "Unassigned",
            `${Number(item.avg_rating).toFixed(1)} (${item.total_ratings})`,
          ])}
        />
      </section>
    </main>
  );
}

function Owner() {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  useEffect(() => {
    storeAPI
      .listStores()
      .then((result) =>
        setStores(
          result.data.filter(
            (store) =>
              store.owner_id === user?.id || store.ownerId === user?.id,
          ),
        ),
      );
  }, [user]);
  return (
    <main className="content">
      <section className="page-heading">
        <h1>My Store</h1>
        <p className="subtle">
          Review your store information and customer ratings.
        </p>
      </section>
      <section className="owner-grid">
        {stores.length ? (
          stores.map((store) => (
            <article className="data-panel" key={store.id}>
              <div className="card-heading">
                <span className="store-initial">{store.name.charAt(0)}</span>
                <span className="rating-summary">
                  <strong>{Number(store.avg_rating).toFixed(1)}</strong>{" "}
                  <Stars value={store.avg_rating} />
                </span>
              </div>
              <h2>{store.name}</h2>
              <p className="subtle">{store.address}</p>
              <p className="rating-count">
                {store.total_ratings} total ratings
              </p>
              <div className="owner-stat">
                <span>Average rating</span>
                <strong>{Number(store.avg_rating).toFixed(1)} / 5</strong>
              </div>
            </article>
          ))
        ) : (
          <div className="data-panel">
            <h2>No assigned store</h2>
            <p className="subtle">
              An administrator can assign a store to your account.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function Protected({ children, roles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/stores"
            element={
              <Discover
                title="Listed Stores"
                subtitle="View the complete list of stores and their ratings."
              />
            }
          />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route
            path="/profile"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />
          <Route
            path="/admin"
            element={
              <Protected roles={["ADMIN"]}>
                <Admin />
              </Protected>
            }
          />
          <Route
            path="/owner"
            element={
              <Protected roles={["STORE_OWNER"]}>
                <Owner />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
