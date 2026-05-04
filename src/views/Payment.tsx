import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check,
  SmartphoneIcon,
  QrCode
} from 'lucide-react';
import { View } from '../types';
import { db, storage } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { useAuth } from '../contexts/AuthContext';
import { sendEmail, getOrderConfirmationHtml } from '../services/emailService';

interface PaymentProps {
  checkoutData: {
    name: string;
    phone: string;
    address: string;
    pincode: string;
    total: number;
    items: string;
  };
  onClearCart: () => void;
  setView: (view: View) => void;
}

export function Payment({ checkoutData, onClearCart, setView }: PaymentProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string>('');
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // New UPI Details
  const UPI_ID = "shiwaniag456-2@okaxis";
  const MERCHANT_NAME = "Shiwani Agrawal";
  const QR_CODE_URL = "https://images.unsplash.com/photo-1622151834677-70f982c9adef?q=80&w=1000&auto=format&fit=crop"; // Placeholder - in real app would use the uploaded asset

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmOrder = async () => {
    if (!user || !proofFile) return;

    setIsSubmitting(true);
    setSubmissionStatus('Confirming Order...');
    
    try {
      const orderId = `TPS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const orderRef = doc(db, 'orders', orderId);
      
      // 1. Create Order Document immediately
      // We do this first to ensure there's a record before showing success
      await setDoc(orderRef, {
        orderId,
        userId: user.uid,
        userEmail: user.email,
        userName: checkoutData.name,
        userPhone: checkoutData.phone,
        address: checkoutData.address,
        pincode: checkoutData.pincode,
        items: checkoutData.items,
        total: checkoutData.total,
        status: 'Order Placed',
        paymentProof: 'Processing Image...',
        timestamp: serverTimestamp(),
      });

      // 2. IMMEDIATE FEEDBACK: Show success screen now
      setOrderSuccess(orderId);
      onClearCart();
      setIsSubmitting(false);

      // 3. BACKGROUND PROCESSING: Upload proof while success screen is shown
      // This runs asynchronously without blocking the UI
      (async () => {
        try {
          const storageRef = ref(storage, `payments/${orderId}_${Date.now()}`);
          const uploadTask = await uploadBytes(storageRef, proofFile);
          const downloadUrl = await getDownloadURL(uploadTask.ref);

          await updateDoc(orderRef, { 
            paymentProof: downloadUrl,
            status: 'Proof Uploaded'
          });

          if (user.email) {
            sendEmail({
              to: user.email,
              subject: `Order Received: ${orderId} | Pastel Story`,
              html: getOrderConfirmationHtml(orderId, checkoutData.name, checkoutData.total)
            }).catch(e => console.warn("Background email failed:", e));
          }
        } catch (bgError) {
          console.error("Background upload failed:", bgError);
          // Update status so admin knows the proof upload failed
          await updateDoc(orderRef, { 
            paymentProof: 'Upload Failed - Manual Check Needed',
            status: 'Upload Failed'
          }).catch(() => {});
        }
      })();

    } catch (error) {
      console.error("Order initiation error:", error);
      handleFirestoreError(error, OperationType.WRITE, 'orders');
      setIsSubmitting(false);
    }
  };

  const getUpiLink = (app: string) => {
    const upiString = `pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${checkoutData.total}&cu=INR&tn=${encodeURIComponent('The Pastel Story Order')}`;
    
    switch(app) {
      case 'phonepe': return `phonepe://pay?${upiString}`;
      case 'gpay': return `tez://pay?${upiString}`;
      case 'paytm': return `paytmmp://pay?${upiString}`;
      default: return `upi://pay?${upiString}`;
    }
  };

  if (orderSuccess) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="font-serif text-4xl text-dark mb-4 italic">Order Placed!</h2>
          <p className="text-light text-sm mb-2 uppercase tracking-widest">Order ID: <span className="text-gold font-bold">{orderSuccess}</span></p>
          <p className="text-[0.6rem] text-gold font-bold uppercase tracking-[0.2em] mb-8">Confirmation Email Sent</p>
          <p className="text-mid text-sm mb-10 leading-relaxed opacity-70">
            Your pieces are now being curated! We've received your payment proof and will finish processing your order shortly. A copy of your order details has been sent to your email.
          </p>
          <button 
            onClick={() => setView('shop')}
            className="w-full bg-dark text-white px-10 py-5 rounded-xl font-bold text-xs tracking-[0.2em] uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-dark/20"
          >
            Go back to Story
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-cream/30 min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('cart')} className="p-2 hover:bg-white rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-dark" />
          </button>
          <h1 className="font-serif text-3xl text-dark italic">Complete Payment</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: QR & Details */}
          <div className="lg:col-span-12">
            <div className="bg-white p-6 rounded-3xl border border-gold/10 shadow-sm mb-8 flex flex-col md:flex-row gap-8 items-center">
               <div className="w-full md:w-1/3 aspect-square bg-cream/20 rounded-2xl flex items-center justify-center p-4 border border-gold/10 relative overflow-hidden group">
                  {/* Using a high-quality placeholder for the QR since the previous raw link might have been unreachable */}
                  <div className="w-full h-full bg-white rounded-xl shadow-inner flex flex-col items-center justify-center p-2">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=shiwaniag456-2@okaxis&pn=Shiwani%20Agrawal" 
                      className="w-full h-full object-contain"
                      alt="Payment QR Code"
                    />
                  </div>
                  <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[0.5rem] uppercase tracking-widest font-bold">
                    Scan to Pay
                  </div>
               </div>
               
               <div className="flex-1 w-full space-y-6 text-center md:text-left">
                  <div>
                    <h2 className="text-[0.6rem] uppercase tracking-[0.3em] font-bold text-gold mb-2">Total Amount Due</h2>
                    <p className="font-serif text-4xl font-bold text-dark italic">₹{checkoutData.total.toLocaleString('en-IN')}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 bg-cream/30 rounded-xl flex items-center justify-between group">
                      <div>
                        <p className="text-[0.5rem] uppercase tracking-widest text-mid opacity-40 mb-1">Our UPI ID</p>
                        <p className="font-mono text-sm tracking-widest text-dark select-all">{UPI_ID}</p>
                      </div>
                      <button 
                        onClick={copyUpi}
                        className="p-3 bg-white hover:bg-gold hover:text-white rounded-lg transition-all shadow-sm"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[0.65rem] text-mid opacity-60 leading-relaxed italic">
                    Pay using the QR code or UPI ID, then upload the screenshot below to confirm your order.
                  </p>
               </div>
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="lg:col-span-12 bg-dark p-8 rounded-3xl text-white shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* App Links */}
              <div className="space-y-6">
                <h2 className="text-[0.7rem] uppercase tracking-[0.4em] font-bold text-gold flex items-center gap-2">
                  <SmartphoneIcon className="w-4 h-4" /> 1. Pay with App
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  <a 
                    href={getUpiLink('phonepe')}
                    className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col items-center gap-3 hover:bg-gold hover:text-dark transition-all group"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20">
                      <SmartphoneIcon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[0.6rem] uppercase tracking-widest">PhonePe</span>
                  </a>
                  <a 
                    href={getUpiLink('gpay')}
                    className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col items-center gap-3 hover:bg-gold hover:text-dark transition-all group"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20">
                      <SmartphoneIcon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[0.6rem] uppercase tracking-widest">Google Pay</span>
                  </a>
                  <a 
                    href={getUpiLink('paytm')}
                    className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col items-center gap-3 hover:bg-gold hover:text-dark transition-all group"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20">
                      <SmartphoneIcon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[0.6rem] uppercase tracking-widest">Paytm</span>
                  </a>
                  <a 
                    href={getUpiLink('bhim')}
                    className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col items-center gap-3 hover:bg-gold hover:text-dark transition-all group"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[0.6rem] uppercase tracking-widest">Other App</span>
                  </a>
                </div>
              </div>

              {/* Upload Section */}
              <div className="space-y-6">
                <h2 className="text-[0.7rem] uppercase tracking-[0.4em] font-bold text-gold flex items-center gap-2">
                  <Upload className="w-4 h-4" /> 2. Upload Proof
                </h2>
                
                <div className="space-y-6">
                  {!proofPreview ? (
                    <label className="block w-full border-2 border-dashed border-white/10 rounded-2xl p-8 cursor-pointer hover:border-gold/50 transition-all group text-center">
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-gold" />
                      </div>
                      <p className="font-bold text-[0.65rem] tracking-widest uppercase mb-1">Click to Upload Screenshot</p>
                      <p className="text-[0.55rem] text-white/30 italic">Required to confirm order</p>
                    </label>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-gold/20 shadow-lg">
                      <img 
                        src={proofPreview} 
                        className="w-full aspect-video object-cover" 
                        alt="Payment Proof" 
                      />
                      <button 
                        onClick={() => { setProofFile(null); setProofPreview(null); }}
                        className="absolute top-2 right-2 bg-dark/80 text-white p-2 rounded-full hover:bg-red-500 transition-colors"
                      >
                        <AlertCircle className="w-4 h-4 rotate-45" />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gold/90 text-dark flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[0.6rem] font-bold uppercase tracking-widest">Screenshot Attached</span>
                      </div>
                    </div>
                  )}

                  <button 
                    disabled={isSubmitting || !proofFile}
                    onClick={handleConfirmOrder}
                    className="w-full py-5 bg-gold text-white rounded-xl font-bold text-xs tracking-[0.2em] uppercase shadow-2xl shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-[0.5rem] tracking-widest">{submissionStatus}</span>
                      </>
                    ) : (
                      <span>Place Order Now</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
