import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
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
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#25D366" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19.1 4.9C17.2 3 14.7 2 12 2S6.8 3 4.9 4.9C3 6.8 2 9.3 2 12s1 5.2 2.9 7.1c1.9 1.9 4.4 2.9 7.1 2.9h.1c2.8 0 5.3-1 7.2-2.9 1.9-1.9 2.9-4.4 2.9-7.1.1-2.8-1-5.3-2.9-7.2zM16.5 15c-.2 0-.4 0-.6-.1-.2-.1-1.3-.6-1.5-1.1-.2-.5.2-1 .3-1.1.1-.1.3-.2.4-.3.1 0 .1-.1.2-.2s0-.2 0-.3c0-.1-.1-.2-.2-.3-.1-.1-.2-.2-.3-.3s-.2-.1-.3 0c-.1 0-1.3.5-1.5.7-.2.2-.4.3-.6.3-.2 0-.4-.1-.6-.2s-.8-.5-1.5-1.2c-.6-.6-1-1.3-1.2-1.5s-.2-.4-.1-.6.3-.5.4-.6c.1-.1.2-.2.3-.3s.2-.2.3-.3c.1-.1.1-.2 0-.4-.1-.1-.1-.6-.2-1s-.3-.8-.4-.9c-.1-.1-.2-.1-.3-.1h-.3c-.1 0-.3.1-.4.2s-.5.5-.6.6c-.1.1-.2.3-.3.4s-.3.4-.4.5c-.1.1-.2.2-.3.3s-.2.2-.3.2c-.1 0-.2 0-.3-.1s-.4-.2-.6-.3c-.2-.1-.4-.2-.6-.3s-.4-.2-.5-.3c-.2-.1-.3-.2-.4-.3s-.2-.2-.3-.3c-.1-.1-.2-.2-.2-.3s-.1-.2-.1-.3c0-.1 0-.2.1-.3s.1-.2.2-.3c.1-.1.1-.2.2-.2s.2-.2.3-.3c.1-.1.1-.2.2-.3s.1-.2.1-.3c0-.1 0-.2-.1-.3s-.1-.2-.2-.3c-.1-.1-.1-.2-.2-.2s-.2-.2-.3-.3c-.1-.1-.2-.1-.3-.1s-.2 0-.3.1c-.1.1-.2.1-.3.2s-.2.2-.3.3c-.1.1-.2.2-.2.3s-.1.2-.1.3c0 .1 0 .2.1.3s.1.2.2.3c.1.1.1.2.2.2s.2.2.3.3c.1.1.1-.2.2-.3s.1-.2.1-.3c0-.1 0-.2-.1-.3s-.1-.2-.2-.3c-.1-.1-.1-.2-.2-.2s-.2-.2-.3-.3c-.1-.1-.2-.1-.3-.1s-.2 0-.3-.1c-.1-.1-.2-.1-.3-.2s-.2-.2-.3-.3c-.1-.1-.2-.2-.2-.3s-.1-.2-.1-.3c0-.1 0-.2.1-.3s.1-.2.2-.3c.1-.1.1-.2.2-.2s.2-.2.3-.3c.1-.1.1-.2.2-.3s.1-.2.1-.3c0-.1 0-.2-.1-.3s-.1-.2-.2-.3c-.1-.1-.1-.2-.2-.2s-.2-.2-.3-.3c-.1-.1-.2-.1-.3-.1z" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

// --- Firebase and Auth Configuration ---
// IMPORTANT: Keep your Firebase config secure and preferably use environment variables.
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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData({ uid: user.uid, ...docSnap.data() });
                    } else {
                        setUserData(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user data:", error);
                    setUserData(null);
                    setLoading(false);
                });
                return () => unsubDoc();
            } else {
                setUserData(null);
                setLoading(false);
            }
        });
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
            role,
            email
        });
        return user;
    };

    const value = { user, userData, loading, login, logout, createUser };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

// --- Google Sheets API Simulation ---
const googleSheetsService = {
    syncPatient: (patientData) => console.log("Simulating: Syncing patient to Google Sheets", patientData),
    deletePatient: (patientId) => console.log("Simulating: Deleting patient from Google Sheets", patientId),
    syncProduct: (productData) => console.log("Simulating: Syncing product to Google Sheets", productData)
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

    if (diffDays < 0) return { text: 'Overdue', color: 'red' };
    if (diffDays <= 15) return { text: 'Due Soon', color: 'yellow' };
    return { text: 'Active', color: 'green' };
};

// --- Reusable Components ---
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full">
                        <XIcon />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const Spinner = () => (
    <div className="flex justify-center items-center h-full p-10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

const Header = () => {
    const { userData, logout } = useAuth();
    return (
        <header className="bg-white shadow-sm p-4 flex flex-wrap justify-between items-center">
            <div className="flex items-center mb-2 sm:mb-0">
                <img src="https://hootone.org/wp-content/uploads/2024/06/cropped-Logo-website.jpg" alt="Hootone Remedies Logo" className="h-10 mr-3" />
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">Patient Follow-up</h1>
            </div>
            {userData && (
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="text-right">
                        <p className="font-semibold text-gray-700 text-sm sm:text-base">{userData.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{userData.role} ({userData.country})</p>
                    </div>
                    <button onClick={logout} className="flex items-center bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors">
                        <LogOutIcon />
                        <span className="ml-2 hidden sm:inline">Logout</span>
                    </button>
                </div>
            )}
        </header>
    );
};

// --- Patient Management Components ---
const PatientForm = ({ patient, onSave, onCancel, products, userData, reps = [] }) => {
    const [formData, setFormData] = useState({
        name: patient?.name || '',
        whatsappNumber: patient?.whatsappNumber || '',
        purchaseDate: patient?.history?.[patient.history.length - 1]?.purchaseDate || new Date().toISOString().split('T')[0],
        packs: patient?.history?.[patient.history.length - 1]?.packs || 1,
        productUsed: patient?.history?.[patient.history.length - 1]?.productUsed || '',
        pricePaid: patient?.history?.[patient.history.length - 1]?.pricePaid || '',
        repId: patient?.repId || '',
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.whatsappNumber || !formData.productUsed || !formData.pricePaid || formData.packs < 1 || (userData?.role === 'admin' && !formData.repId)) {
            setError('Please fill all fields correctly. Admin must assign a representative.');
            return;
        }
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Patient Name" className="w-full p-3 border rounded-lg" required />
                <input type="text" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} placeholder="WhatsApp Number (e.g., 919876543210)" className="w-full p-3 border rounded-lg" required />
                {userData?.role === 'admin' && (
                    <select name="repId" value={formData.repId} onChange={handleChange} className="w-full p-3 border rounded-lg" required>
                        <option value="">Assign a Representative</option>
                        {reps.map(r => <option key={r.id} value={r.id}>{r.name} ({r.country})</option>)}
                    </select>
                )}
                <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
                <input type="number" name="packs" min="1" value={formData.packs} onChange={handleChange} placeholder="Number of Packs" className="w-full p-3 border rounded-lg" required />
                <select name="productUsed" value={formData.productUsed} onChange={handleChange} className="w-full p-3 border rounded-lg" required>
                    <option value="">Select a Product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" name="pricePaid" value={formData.pricePaid} onChange={handleChange} placeholder="Price Paid (USD)" className="w-full p-3 border rounded-lg" required />
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
                    <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="w-full p-3 border rounded-lg mt-1" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Number of Packs</label>
                    <input type="number" min="1" value={packs} onChange={e => setPacks(e.target.value)} className="w-full p-3 border rounded-lg mt-1" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Product</label>
                    <select value={productUsed} onChange={e => setProductUsed(e.target.value)} className="w-full p-3 border rounded-lg mt-1" required>
                        <option value="">Select a Product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">New Price Paid (USD)</label>
                    <input type="number" value={pricePaid} onChange={e => setPricePaid(e.target.value)} placeholder="e.g., 250" className="w-full p-3 border rounded-lg mt-1" />
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
    const getProductName = (productId) => products.find(p => p.id === productId)?.name || 'Unknown';

    const statusColorMap = {
        red: 'bg-red-100 text-red-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        green: 'bg-green-100 text-green-800',
        gray: 'bg-gray-100 text-gray-800',
    };

    if (patients.length === 0) {
        return <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow">No patients found.</div>;
    }

    return (
        <div>
            {/* --- Desktop Table View (hidden on mobile) --- */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
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
                        {patients.map(patient => {
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
                                    <td className="px-6 py-4 whitespace-nowrap"><span className={statusClasses}>{patient.recentlyReordered ? 'Reordered' : status.text}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{patient.nextDueDate ? patient.nextDueDate.toDate().toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            <a href={`https://wa.me/${patient.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-900" title="Message on WhatsApp"><WhatsAppIcon /></a>
                                            <button onClick={() => onReorder(patient)} className="text-blue-600 hover:text-blue-900" title="Reorder"><RefreshCwIcon /></button>
                                            <button onClick={() => onEdit(patient)} className="text-indigo-600 hover:text-indigo-900" title="Edit"><EditIcon /></button>
                                            <button onClick={() => onDelete(patient.id)} className="text-red-600 hover:text-red-900" title="Delete"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* --- Mobile Card View (visible on mobile) --- */}
            <div className="md:hidden space-y-4">
                {patients.map(patient => {
                    const lastOrder = patient.history[patient.history.length - 1];
                    const status = getStatus(patient.nextDueDate?.toDate());
                    const statusClasses = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[status.color]}`;
                    return (
                        <div key={patient.id} className="bg-white rounded-lg shadow p-4 space-y-3">
                            {/* Patient Info */}
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{patient.name}</h3>
                                <p className="text-sm text-gray-600">{patient.whatsappNumber}</p>
                            </div>
                            {/* Order Details */}
                            <div className="border-t pt-3">
                                <p className="text-sm"><span className="font-semibold text-gray-700">Last Order:</span> {getProductName(lastOrder.productUsed)} ({lastOrder.packs} packs) for ${lastOrder.pricePaid}</p>
                                <p className="text-sm"><span className="font-semibold text-gray-700">Date:</span> {new Date(lastOrder.purchaseDate).toLocaleDateString()}</p>
                            </div>
                            {/* Status and Due Date */}
                            <div className="flex justify-between items-center border-t pt-3">
                                <div>
                                    <span className="font-semibold text-gray-700 text-sm">Status: </span>
                                    <span className={statusClasses}>{patient.recentlyReordered ? 'Reordered' : status.text}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-700 text-sm">Due Date</p>
                                    <p className="text-sm">{patient.nextDueDate ? patient.nextDueDate.toDate().toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                            {/* Action Buttons */}
                            <div className="border-t pt-3 grid grid-cols-2 gap-2">
                                <a href={`https://wa.me/${patient.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm">
                                    <WhatsAppIcon /><span>WhatsApp</span>
                                </a>
                                <button onClick={() => onReorder(patient)} className="flex items-center justify-center space-x-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                                    <RefreshCwIcon /><span>Reorder</span>
                                </button>
                                <button onClick={() => onEdit(patient)} className="flex items-center justify-center space-x-2 bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition-colors text-sm">
                                    <EditIcon /><span>Edit</span>
                                </button>
                                <button onClick={() => onDelete(patient.id)} className="flex items-center justify-center space-x-2 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm">
                                    <TrashIcon /><span>Delete</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
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
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
                <div className="flex justify-center mb-6">
                    <img src="https://hootone.org/wp-content/uploads/2024/06/cropped-Logo-website.jpg" alt="Hootone Remedies" className="h-20" />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Hootone One - Login</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><UserIcon /></span>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><LockIcon /></span>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-300">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">&copy; {new Date().getFullYear()} Hootone Remedies. Managed by Choose4Choice.</p>
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
        const productsUnsub = onSnapshot(collection(db, 'products'), (snapshot) => {
            if (isMounted) setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const q = query(collection(db, 'patients'), where('repId', '==', userData.uid));
        const patientsUnsub = onSnapshot(q, (snapshot) => {
            if (isMounted) {
                setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoading(false);
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

    if (loading) return <div className="p-4 md:p-8"><Spinner /></div>;

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">My Patients</h2>
                <button onClick={() => setAddModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <PlusCircleIcon /><span className="ml-2">Add Patient</span>
                </button>
            </div>
            <div className="mb-6 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><SearchIcon /></span>
                <input type="text" placeholder="Search by name or WhatsApp number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border rounded-lg" />
            </div>

            <PatientTable patients={filteredPatients} onEdit={openEditModal} onDelete={handleDeletePatient} onReorder={openReorderModal} products={products} />

            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Patient"><PatientForm onSave={handleAddPatient} onCancel={() => setAddModalOpen(false)} products={products} /></Modal>
            {selectedPatient && <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit ${selectedPatient.name}`}><PatientForm patient={selectedPatient} onSave={handleEditPatient} onCancel={() => setEditModalOpen(false)} products={products} /></Modal>}
            {selectedPatient && <ReorderModal patient={selectedPatient} isOpen={isReorderModalOpen} onClose={() => setReorderModalOpen(false)} onReorder={handleReorder} products={products} />}
        </div>
    );
};

// --- Admin Components ---
const ProductManager = ({ products, onSave, onDelete }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [priceUSD, setPriceUSD] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!name || !priceUSD || !imageUrl) {
            setError('All fields are required.');
            return;
        }
        await onSave({ name, priceUSD: parseFloat(priceUSD), imageUrl });
        setName(''); setPriceUSD(''); setImageUrl(''); setError(''); setModalOpen(false);
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-semibold text-gray-800">Manage Products</h3>
                <button onClick={() => setModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    <PlusCircleIcon /><span className="ml-2">Add Product</span>
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Product Name" className="w-full p-3 border rounded-lg" />
                    <input type="number" value={priceUSD} onChange={e => setPriceUSD(e.target.value)} placeholder="Price (USD)" className="w-full p-3 border rounded-lg" />
                    <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Product Image URL" className="w-full p-3 border rounded-lg" />
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
    const { userData } = useAuth();
    const [allPatients, setAllPatients] = useState([]);
    const [products, setProducts] = useState([]);
    const [reps, setReps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ country: 'all', rep: 'all', status: 'all' });

    // State for modals and selected patient
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isReorderModalOpen, setReorderModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const patientsUnsub = onSnapshot(collection(db, 'patients'), (snapshot) => {
            if (isMounted) {
                setAllPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoading(false);
            }
        });
        const productsUnsub = onSnapshot(collection(db, 'products'), (snapshot) => {
            if (isMounted) setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const repsQuery = query(collection(db, 'users'), where('role', '==', 'representative'));
        const repsUnsub = onSnapshot(repsQuery, (snapshot) => {
            if (isMounted) setReps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => { isMounted = false; patientsUnsub(); productsUnsub(); repsUnsub(); };
    }, []);

    // Modal opener functions
    const openEditModal = (patient) => {
        setSelectedPatient(patient);
        setEditModalOpen(true);
    };

    const openReorderModal = (patient) => {
        setSelectedPatient(patient);
        setReorderModalOpen(true);
    };

    // Patient CRUD handlers for Admin
    const handleAddPatient = async (patientData) => {
        try {
            const selectedRep = reps.find(r => r.id === patientData.repId);
            if (!selectedRep) {
                console.error("Selected representative not found!");
                alert("Please select a representative.");
                return;
            }

            const nextDueDate = calculateNextDueDate(patientData.purchaseDate, patientData.packs);
            const newPatient = {
                name: patientData.name,
                whatsappNumber: patientData.whatsappNumber,
                repId: selectedRep.id,
                repName: selectedRep.name,
                country: selectedRep.country,
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

            const updatedHistory = [...selectedPatient.history];
            updatedHistory[updatedHistory.length - 1] = {
                purchaseDate: patientData.purchaseDate,
                packs: parseInt(patientData.packs, 10),
                pricePaid: parseFloat(patientData.pricePaid),
                productUsed: patientData.productUsed,
            };

            const updatedPatientData = {
                name: patientData.name,
                whatsappNumber: patientData.whatsappNumber,
                history: updatedHistory,
                nextDueDate: nextDueDate,
                lastUpdatedAt: serverTimestamp(),
            };

            if (patientData.repId && patientData.repId !== selectedPatient.repId) {
                const newRep = reps.find(r => r.id === patientData.repId);
                if (newRep) {
                    updatedPatientData.repId = newRep.id;
                    updatedPatientData.repName = newRep.name;
                    updatedPatientData.country = newRep.country;
                }
            }

            await updateDoc(patientRef, updatedPatientData);
            googleSheetsService.syncPatient({ id: selectedPatient.id, ...updatedPatientData });
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

    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleProductSave = async ({ name, priceUSD, imageUrl }) => {
        try {
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
        }
    };

    const filteredPatients = allPatients.filter(patient => {
        const status = getStatus(patient.nextDueDate?.toDate());
        const countryMatch = filters.country === 'all' || patient.country === filters.country;
        const repMatch = filters.rep === 'all' || patient.repId === filters.rep;
        const statusMatch = filters.status === 'all' ||
            (filters.status === 'due' && status.text === 'Due Soon') ||
            (filters.status === 'overdue' && status.text === 'Overdue') ||
            (filters.status === 'reordered' && patient.recentlyReordered);
        return countryMatch && repMatch && statusMatch;
    });

    const uniqueCountries = [...new Set(reps.map(r => r.country))];
    if (loading) return <div className="p-4 md:p-8"><Spinner /></div>;

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Admin Global Dashboard</h2>
                <button onClick={() => setAddModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <PlusCircleIcon /><span className="ml-2">Add Patient</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-white rounded-lg shadow">
                <div className="lg:col-span-1 flex items-center space-x-2">
                    <FilterIcon className="text-gray-500" />
                    <h3 className="font-semibold">Filters</h3>
                </div>
                <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                    <select name="country" id="country" value={filters.country} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                        <option value="all">All Countries</option>
                        {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="rep" className="block text-sm font-medium text-gray-700">Representative</label>
                    <select name="rep" id="rep" value={filters.rep} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                        <option value="all">All Reps</option>
                        {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Patient Status</label>
                    <select name="status" id="status" value={filters.status} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                        <option value="all">All Statuses</option>
                        <option value="due">Due within 15 days</option>
                        <option value="overdue">Missed Follow-ups</option>
                        <option value="reordered">Recently Reordered</option>
                    </select>
                </div>
            </div>

            <PatientTable patients={filteredPatients} products={products} onEdit={openEditModal} onDelete={handleDeletePatient} onReorder={openReorderModal} />
            <ProductManager products={products} onSave={handleProductSave} onDelete={handleProductDelete} />

            {/* Modals for Admin */}
            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Patient">
                <PatientForm
                    onSave={handleAddPatient}
                    onCancel={() => setAddModalOpen(false)}
                    products={products}
                    userData={userData}
                    reps={reps}
                />
            </Modal>

            {selectedPatient && (
                <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit ${selectedPatient.name}`}>
                    <PatientForm
                        patient={selectedPatient}
                        onSave={handleEditPatient}
                        onCancel={() => setEditModalOpen(false)}
                        products={products}
                        userData={userData}
                        reps={reps}
                    />
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Spinner /></div>
        );
    }
    if (!user || !userData) {
        return <LoginPage />;
    }
    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Header />
            <main>
                {userData.role === 'admin' ? <AdminDashboard /> : <RepDashboard />}
            </main>
        </div>
    );
}

export default App;
