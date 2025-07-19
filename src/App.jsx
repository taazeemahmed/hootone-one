import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInAnonymously,
    signInWithCustomToken
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- Helper Icons (using SVG for simplicity) ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const LogOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;
const RefreshCwIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#25D366" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19.1 4.9C17.2 3 14.7 2 12 2S6.8 3 4.9 4.9C3 6.8 2 9.3 2 12s1 5.2 2.9 7.1c1.9 1.9 4.4 2.9 7.1 2.9h.1c2.8 0 5.3-1 7.2-2.9 1.9-1.9 2.9-4.4 2.9-7.1.1-2.8-1-5.3-2.9-7.2zM16.5 15c-.2 0-.4 0-.6-.1-.2-.1-1.3-.6-1.5-1.1-.2-.5.2-1 .3-1.1.1-.1.3-.2.4-.3.1 0 .1-.1.2-.2s0-.2 0-.3c0-.1-.1-.2-.2-.3-.1-.1-.2-.2-.3-.3s-.2-.1-.3 0c-.1 0-1.3.5-1.5.7-.2.2-.4.3-.6.3-.2 0-.4-.1-.6-.2s-.8-.5-1.5-1.2c-.6-.6-1-1.3-1.2-1.5s-.2-.4-.1-.6.3-.5.4-.6c.1-.1.2-.2.3-.3s.2-.2.3-.3c.1-.1.1-.2 0-.4-.1-.1-.1-.6-.2-1s-.3-.8-.4-.9c-.1-.1-.2-.1-.3-.1h-.3c-.1 0-.3.1-.4.2s-.5.5-.6.6c-.1.1-.2.3-.3.4s-.3.4-.4.5c-.1.1-.2.2-.3.3s-.2.2-.3.2c-.1 0-.2 0-.3-.1s-.4-.2-.6-.3c-.2-.1-.4-.2-.6-.3s-.4-.2-.5-.3c-.2-.1-.3-.2-.4-.3s-.2-.2-.3-.3c-.1-.1-.2-.2-.2-.3s-.1-.2-.1-.3c0-.1 0-.2.1-.3s.1-.2.2-.3c.1-.1.1-.2.2-.2s.2-.2.3-.3c.1-.1.1-.2.2-.3s.1-.2.1-.3c0-.1 0-.2-.1-.3s-.1-.2-.2-.3c-.1-.1-.1-.2-.2-.2s-.2-.2-.3-.3c-.1-.1-.2-.1-.3-.1s-.2 0-.3.1c-.1.1-.2.1-.3.2s-.2.2-.3.3c-.1.1-.2.2-.2.3s-.1.2-.1.3c0 .1 0 .2.1.3s.1.2.2.3c.1.1.1.2.2.2s.2.2.3.3c.1.1.1.2.2.3s.1.2.1.3c0 .1 0 .2-.1.3s-.1.2-.2.3c-.1-.1-.1.2-.2.2s-.2.2-.3.3c-.1.1-.2.1-.3.1s-.2 0-.3-.1c-.1-.1-.2-.1-.3-.2s-.2-.2-.3-.3c-.1-.1-.2-.2-.2-.3s-.1-.2-.1-.3c0-.1 0-.2.1-.3s.1-.2.2-.3c.1-.1.1-.2.2-.2s.2-.2.3-.3c.1-.1.1-.2.2-.3s.1-.2.1-.3c0-.1 0-.2-.1-.3s-.1-.2-.2-.3c-.1-.1-.1-.2-.2-.2s-.2-.2-.3-.3c-.1-.1-.2-.1-.3-.1z" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0z" /><path d="M12 15H3l-1-5L2 2h20l.95 8-1 .95Z" /><path d="m3.5 15 4.5-3 4.5 3 4.5-3" /></svg>;

// --- Firebase and Auth Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDMYCUMBduZ6wpngG34uJPxGpW_nyqRSR4",
    authDomain: "hootoneone.firebaseapp.com",
    projectId: "hootoneone",
    storageBucket: "hootoneone.firebasestorage.app",
    messagingSenderId: "919764181178",
    appId: "1:919764181178:web:7907f6dbfa11824d32a283",
    measurementId: "G-466NJXEWJS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This listener handles all authentication state changes.
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                // If a user is logged in, fetch their specific data from Firestore.
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    // User document found, set the user data.
                    setUserData({ uid: user.uid, ...userDocSnap.data() });
                } else {
                    // This can happen if a user is in Auth but not Firestore.
                    // Treat them as not fully logged in by clearing user data.
                    setUserData(null);
                }
            } else {
                // No user is logged in, clear any existing user data.
                setUserData(null);
            }
            // IMPORTANT: Set loading to false only after all checks are complete.
            setLoading(false);
        });

        // Cleanup the listener when the component unmounts.
        return () => unsubscribe();
    }, []);

    const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
    const logout = () => signOut(auth);

    const createUser = async (email, password, name, country, role) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
            name,
            country,
            role, // 'admin' or 'representative'
            email
        });
        return user;
    };

    const value = { user, userData, loading, login, logout, createUser };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};

// --- Google Sheets API Simulation ---
const googleSheetsService = {
    syncPatient: (patientData) => {
        console.log("Simulating: Syncing patient to Google Sheets", patientData);
    },
    deletePatient: (patientId) => {
        console.log("Simulating: Deleting patient from Google Sheets", patientId);
    },
    syncProduct: (productData) => {
        console.log("Simulating: Syncing product to Google Sheets", productData);
    }
};

// --- Helper Functions ---
const calculateNextDueDate = (purchaseDate, packs) => {
    const date = new Date(purchaseDate);
    date.setMonth(date.getMonth() + parseInt(packs, 10));
    return date;
};

const getStatus = (dueDate) => {
    if (!dueDate) return { text: 'N/A', color: 'gray' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateObj = new Date(dueDate);
    dueDateObj.setHours(0, 0, 0, 0);

    const diffTime = dueDateObj - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { text: 'Overdue', color: 'red' };
    }
    if (diffDays <= 15) {
        return { text: 'Due Soon', color: 'yellow' };
    }
    return { text: 'Active', color: 'green' };
};

// --- Reusable Components ---
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <XIcon />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

const Spinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

const Header = () => {
    const { userData, logout } = useAuth();

    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
            <div className="flex items-center">
                <img src="https://i.ibb.co/pW6vj9h/hootone-remedies-logo.png" alt="Hootone Remedies Logo" className="h-10 mr-3" />
                <h1 className="text-xl font-bold text-gray-800">Patient Follow-up System</h1>
            </div>
            {userData && (
                <div className="flex items-center">
                    <div className="text-right mr-4">
                        <p className="font-semibold text-gray-700">{userData.name}</p>
                        <p className="text-sm text-gray-500">{userData.role} ({userData.country})</p>
                    </div>
                    <button onClick={logout} className="flex items-center bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors">
                        <LogOutIcon />
                        <span className="ml-2">Logout</span>
                    </button>
                </div>
            )}
        </header>
    );
};

// --- Patient Management Components ---
const PatientForm = ({ patient, onSave, onCancel, products }) => {
    const [formData, setFormData] = useState({
        name: patient?.name || '',
        whatsappNumber: patient?.whatsappNumber || '',
        purchaseDate: patient?.history?.[patient.history.length - 1]?.purchaseDate || new Date().toISOString().split('T')[0],
        packs: patient?.history?.[patient.history.length - 1]?.packs || 1,
        productUsed: patient?.history?.[patient.history.length - 1]?.productUsed || '',
        pricePaid: patient?.history?.[patient.history.length - 1]?.pricePaid || '',
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.whatsappNumber || !formData.productUsed || !formData.pricePaid || formData.packs < 1) {
            setError('Please fill all fields correctly.');
            return;
        }
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Patient Name" className="w-full p-2 border rounded-lg" required />
                <input type="text" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} placeholder="WhatsApp Number (e.g., 919876543210)" className="w-full p-2 border rounded-lg" required />
                <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
                <input type="number" name="packs" min="1" value={formData.packs} onChange={handleChange} placeholder="Number of Packs" className="w-full p-2 border rounded-lg" required />
                <select name="productUsed" value={formData.productUsed} onChange={handleChange} className="w-full p-2 border rounded-lg" required>
                    <option value="">Select a Product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" name="pricePaid" value={formData.pricePaid} onChange={handleChange} placeholder="Price Paid (USD)" className="w-full p-2 border rounded-lg" required />
            </div>
            <div className="flex justify-end mt-6 space-x-3">
                <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save Patient</button>
            </div>
        </form>
    );
};

const ReorderModal = ({ patient, isOpen, onClose, onReorder, products }) => {
    const [packs, setPacks] = useState(1);
    const [pricePaid, setPricePaid] = useState('');
    const [productUsed, setProductUsed] = useState(patient?.history?.[patient.history.length - 1]?.productUsed || '');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');

    const handleReorder = () => {
        if (packs < 1 || !pricePaid || !productUsed) {
            setError('Please fill all fields correctly.');
            return;
        }
        onReorder({ packs, pricePaid, productUsed, purchaseDate });
        onClose();
        // Reset state
        setPacks(1);
        setPricePaid('');
        setError('');
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reorder for ${patient.name}`}>
            <div className="space-y-4">
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div>
                    <label className="block text-sm font-medium text-gray-700">New Purchase Date</label>
                    <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Number of Packs</label>
                    <input type="number" min="1" value={packs} onChange={e => setPacks(e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Product</label>
                    <select value={productUsed} onChange={e => setProductUsed(e.target.value)} className="w-full p-2 border rounded-lg mt-1" required>
                        <option value="">Select a Product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">New Price Paid (USD)</label>
                    <input type="number" value={pricePaid} onChange={e => setPricePaid(e.target.value)} placeholder="e.g., 250" className="w-full p-2 border rounded-lg mt-1" />
                </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
                <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                <button onClick={handleReorder} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Confirm Reorder</button>
            </div>
        </Modal>
    );
};

const PatientTable = ({ patients, onEdit, onDelete, onReorder, products }) => {
    const getProductName = (productId) => {
        const product = products.find(p => p.id === productId);
        return product ? product.name : 'Unknown Product';
    };

    const statusColorMap = {
        red: 'bg-red-100 text-red-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        green: 'bg-green-100 text-green-800',
        gray: 'bg-gray-100 text-gray-800',
    };

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Order</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {patients.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-10 text-gray-500">No patients found.</td></tr>
                    ) : patients.map(patient => {
                        const lastOrder = patient.history[patient.history.length - 1];
                        const status = getStatus(patient.nextDueDate?.toDate());
                        const statusClasses = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[status.color]}`;

                        return (
                            <tr key={patient.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                    <div className="text-sm text-gray-500">{patient.whatsappNumber}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{getProductName(lastOrder.productUsed)} ({lastOrder.packs} packs)</div>
                                    <div className="text-sm text-gray-500">${lastOrder.pricePaid} on {new Date(lastOrder.purchaseDate).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={statusClasses}>
                                        {patient.recentlyReordered ? 'Reordered' : status.text}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {patient.nextDueDate ? patient.nextDueDate.toDate().toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-3">
                                        <a href={`https://wa.me/${patient.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-900" title="Message on WhatsApp">
                                            <WhatsAppIcon />
                                        </a>
                                        <button onClick={() => onReorder(patient)} className="text-blue-600 hover:text-blue-900" title="Reorder">
                                            <RefreshCwIcon />
                                        </button>
                                        <button onClick={() => onEdit(patient)} className="text-indigo-600 hover:text-indigo-900" title="Edit">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDelete(patient.id)} className="text-red-600 hover:text-red-900" title="Delete">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// --- Pages ---
const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            // Redirect will happen automatically via the App component's logic
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
            <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
                <div className="flex justify-center mb-6">
                    <img src="https://i.ibb.co/pW6vj9h/hootone-remedies-logo.png" alt="Hootone Remedies" className="h-20" />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Rep & Admin Login</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <UserIcon />
                        </span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <LockIcon />
                        </span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-300"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">
                &copy; {new Date().getFullYear()} Hootone Remedies. Managed by Choose4Choice.
            </p>
        </div>
    );
};

const RepDashboard = () => {
    const { userData } = useAuth();
    const [patients, setPatients] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isReorderModalOpen, setReorderModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!userData) return;

        let isMounted = true;

        // Fetch Products
        const productsUnsub = onSnapshot(collection(db, 'products'), (snapshot) => {
            if (isMounted) {
                const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProducts(productsData);
            }
        });

        // Fetch Patients for this Rep
        const q = query(collection(db, 'patients'), where('repId', '==', userData.uid));
        const patientsUnsub = onSnapshot(q, (snapshot) => {
            if (isMounted) {
                const patientsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setPatients(patientsData);
                setLoading(false); // Set loading to false after patients are fetched
            }
        });

        return () => {
            isMounted = false;
            productsUnsub();
            patientsUnsub();
        };
    }, [userData]);

    const handleAddPatient = async (patientData) => {
        try {
            const nextDueDate = calculateNextDueDate(patientData.purchaseDate, patientData.packs);
            const newPatient = {
                ...patientData,
                repId: userData.uid,
                repName: userData.name,
                country: userData.country,
                history: [{
                    purchaseDate: patientData.purchaseDate,
                    packs: parseInt(patientData.packs, 10),
                    pricePaid: parseFloat(patientData.pricePaid),
                    productUsed: patientData.productUsed,
                }],
                nextDueDate: nextDueDate,
                createdAt: serverTimestamp(),
                lastUpdatedAt: serverTimestamp(),
                recentlyReordered: false,
            };
            const docRef = await addDoc(collection(db, 'patients'), newPatient);
            googleSheetsService.syncPatient({ id: docRef.id, ...newPatient });
            setAddModalOpen(false);
        } catch (error) {
            console.error("Error adding patient: ", error);
        }
    };

    const handleEditPatient = async (patientData) => {
        try {
            const patientRef = doc(db, 'patients', selectedPatient.id);
            const nextDueDate = calculateNextDueDate(patientData.purchaseDate, patientData.packs);

            // Create a new history entry
            const updatedHistory = [...selectedPatient.history];
            updatedHistory[updatedHistory.length - 1] = {
                purchaseDate: patientData.purchaseDate,
                packs: parseInt(patientData.packs, 10),
                pricePaid: parseFloat(patientData.pricePaid),
                productUsed: patientData.productUsed,
            };

            const updatedPatient = {
                ...patientData,
                history: updatedHistory,
                nextDueDate: nextDueDate,
                lastUpdatedAt: serverTimestamp(),
            };
            await updateDoc(patientRef, updatedPatient);
            googleSheetsService.syncPatient({ id: selectedPatient.id, ...updatedPatient });
            setEditModalOpen(false);
            setSelectedPatient(null);
        } catch (error) {
            console.error("Error updating patient: ", error);
        }
    };

    const handleDeletePatient = async (patientId) => {
        if (window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            try {
                await deleteDoc(doc(db, 'patients', patientId));
                googleSheetsService.deletePatient(patientId);
            } catch (error) {
                console.error("Error deleting patient: ", error);
            }
        }
    };

    const handleReorder = async (reorderData) => {
        try {
            const patientRef = doc(db, 'patients', selectedPatient.id);
            const nextDueDate = calculateNextDueDate(reorderData.purchaseDate, reorderData.packs);
            const newHistoryEntry = {
                purchaseDate: reorderData.purchaseDate,
                packs: parseInt(reorderData.packs, 10),
                pricePaid: parseFloat(reorderData.pricePaid),
                productUsed: reorderData.productUsed,
            };
            const updatedPatient = {
                history: [...selectedPatient.history, newHistoryEntry],
                nextDueDate: nextDueDate,
                lastUpdatedAt: serverTimestamp(),
                recentlyReordered: true,
            };
            await updateDoc(patientRef, updatedPatient);
            googleSheetsService.syncPatient({ id: selectedPatient.id, ...updatedPatient });
            setReorderModalOpen(false);
            setSelectedPatient(null);
        } catch (error) {
            console.error("Error reordering: ", error);
        }
    };

    const openEditModal = (patient) => {
        setSelectedPatient(patient);
        setEditModalOpen(true);
    };

    const openReorderModal = (patient) => {
        setSelectedPatient(patient);
        setReorderModalOpen(true);
    };

    const filteredPatients = patients.filter(p =>
        p.whatsappNumber.includes(searchTerm) || p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8"><Spinner /></div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Patients</h2>
                <button onClick={() => setAddModalOpen(true)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <PlusCircleIcon />
                    <span className="ml-2">Add Patient</span>
                </button>
            </div>
            <div className="mb-6 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon />
                </span>
                <input
                    type="text"
                    placeholder="Search by name or WhatsApp number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
            </div>

            <PatientTable
                patients={filteredPatients}
                onEdit={openEditModal}
                onDelete={handleDeletePatient}
                onReorder={openReorderModal}
                products={products}
            />

            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Patient">
                <PatientForm onSave={handleAddPatient} onCancel={() => setAddModalOpen(false)} products={products} />
            </Modal>

            {selectedPatient && (
                <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit ${selectedPatient.name}`}>
                    <PatientForm patient={selectedPatient} onSave={handleEditPatient} onCancel={() => setEditModalOpen(false)} products={products} />
                </Modal>
            )}

            {selectedPatient && (
                <ReorderModal
                    patient={selectedPatient}
                    isOpen={isReorderModalOpen}
                    onClose={() => setReorderModalOpen(false)}
                    onReorder={handleReorder}
                    products={products}
                />
            )}
        </div>
    );
};

// --- Admin Components ---
const ProductManager = ({ products, onSave, onDelete }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [priceUSD, setPriceUSD] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!name || !priceUSD || !imageFile) {
            setError('All fields are required.');
            return;
        }
        await onSave({ name, priceUSD: parseFloat(priceUSD), imageFile });
        setName('');
        setPriceUSD('');
        setImageFile(null);
        setError('');
        setModalOpen(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Manage Products</h3>
                <button onClick={() => setModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    <PlusCircleIcon />
                    <span className="ml-2">Add Product</span>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                    <div key={product.id} className="border rounded-lg p-4 flex flex-col justify-between">
                        <img src={product.imageUrl} alt={product.name} className="h-32 w-full object-cover rounded-md mb-2" />
                        <h4 className="font-bold">{product.name}</h4>
                        <p className="text-gray-600">${product.priceUSD}</p>
                        <button onClick={() => onDelete(product.id)} className="text-red-500 hover:text-red-700 text-sm mt-2 self-start">Delete</button>
                    </div>
                ))}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add New Product">
                <div className="space-y-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Product Name" className="w-full p-2 border rounded-lg" />
                    <input type="number" value={priceUSD} onChange={e => setPriceUSD(e.target.value)} placeholder="Price (USD)" className="w-full p-2 border rounded-lg" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product Image</label>
                        <input type="file" onChange={e => setImageFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <button onClick={() => setModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Save Product</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const AdminDashboard = () => {
    const [allPatients, setAllPatients] = useState([]);
    const [products, setProducts] = useState([]);
    const [reps, setReps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        country: 'all',
        rep: 'all',
        status: 'all', // all, due, overdue, reordered
    });

    useEffect(() => {
        let isMounted = true;
        // Fetch All Patients
        const patientsUnsub = onSnapshot(collection(db, 'patients'), (snapshot) => {
            if (isMounted) {
                const patientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllPatients(patientsData);
                setLoading(false); // Set loading to false after patients are fetched
            }
        });

        // Fetch All Products
        const productsUnsub = onSnapshot(collection(db, 'products'), (snapshot) => {
            if (isMounted) {
                const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProducts(productsData);
            }
        });

        // Fetch All Reps
        const repsQuery = query(collection(db, 'users'), where('role', '==', 'representative'));
        const repsUnsub = onSnapshot(repsQuery, (snapshot) => {
            if (isMounted) {
                const repsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setReps(repsData);
            }
        });

        return () => {
            isMounted = false;
            patientsUnsub();
            productsUnsub();
            repsUnsub();
        };
    }, []);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleProductSave = async ({ name, priceUSD, imageFile }) => {
        try {
            // 1. Upload image to Firebase Storage
            const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(imageRef, imageFile);
            const imageUrl = await getDownloadURL(snapshot.ref);

            // 2. Save product data to Firestore
            const newProduct = { name, priceUSD, imageUrl, createdAt: serverTimestamp() };
            const docRef = await addDoc(collection(db, 'products'), newProduct);
            googleSheetsService.syncProduct({ id: docRef.id, ...newProduct });
        } catch (error) {
            console.error("Error saving product:", error);
        }
    };

    const handleProductDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            await deleteDoc(doc(db, 'products', productId));
            // You might also want to delete the image from Storage here
        }
    };

    const filteredPatients = allPatients.filter(patient => {
        const status = getStatus(patient.nextDueDate?.toDate());
        const isDue = status.text === 'Due Soon';
        const isOverdue = status.text === 'Overdue';

        const countryMatch = filters.country === 'all' || patient.country === filters.country;
        const repMatch = filters.rep === 'all' || patient.repId === filters.rep;
        const statusMatch = filters.status === 'all' ||
            (filters.status === 'due' && isDue) ||
            (filters.status === 'overdue' && isOverdue) ||
            (filters.status === 'reordered' && patient.recentlyReordered);

        return countryMatch && repMatch && statusMatch;
    });

    const uniqueCountries = [...new Set(reps.map(r => r.country))];

    if (loading) return <div className="p-8"><Spinner /></div>;

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Global Dashboard</h2>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-white rounded-lg shadow">
                <div className="flex items-center space-x-2">
                    <FilterIcon className="text-gray-500" />
                    <h3 className="font-semibold">Filters</h3>
                </div>
                <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                    <select name="country" id="country" value={filters.country} onChange={handleFilterChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="all">All Countries</option>
                        {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="rep" className="block text-sm font-medium text-gray-700">Representative</label>
                    <select name="rep" id="rep" value={filters.rep} onChange={handleFilterChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="all">All Reps</option>
                        {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Patient Status</label>
                    <select name="status" id="status" value={filters.status} onChange={handleFilterChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="all">All Statuses</option>
                        <option value="due">Due within 15 days</option>
                        <option value="overdue">Missed Follow-ups</option>
                        <option value="reordered">Recently Reordered</option>
                    </select>
                </div>
            </div>

            <PatientTable patients={filteredPatients} products={products} onEdit={() => { }} onDelete={() => { }} onReorder={() => { }} />

            <ProductManager products={products} onSave={handleProductSave} onDelete={handleProductDelete} />
        </div>
    );
};

// --- Main App Component ---
function App() {
    return (
        <AuthProvider>
            <MainApp />
        </AuthProvider>
    );
}

const MainApp = () => {
    const { user, userData, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!user || !userData) {
        return <LoginPage />;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header />
            <main>
                {userData.role === 'admin' ? <AdminDashboard /> : <RepDashboard />}
            </main>
        </div>
    );
}

export default App;
