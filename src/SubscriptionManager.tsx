import React, { useState, useEffect } from 'react';
import { FIXED_PLANS, Plan, createSubscription, submitPayment, getUserSubscription, Subscription } from './subscriptionService';
import { getModels, OpenRouterModel } from './openRouterService';
import { motion, AnimatePresence } from 'motion/react';
import { Check, CreditCard, Shield, Zap, Info, Upload, AlertCircle, X } from 'lucide-react';
import { auth } from './firebase';

export const SubscriptionManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'models' | 'payment'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const models = await getModels();
        // Filter for some popular paid models
        const paidModels = models.filter(m => parseFloat(m.pricing.prompt) > 0).slice(0, 20);
        setAvailableModels(paidModels);
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };

    const fetchSub = async () => {
      const sub = await getUserSubscription();
      setCurrentSubscription(sub);
    };

    fetchModels();
    fetchSub();
  }, []);

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setActiveTab('models');
  };

  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter(id => id !== modelId));
    } else if (selectedPlan && selectedModels.length < selectedPlan.maxModels) {
      setSelectedModels([...selectedModels, modelId]);
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceipt(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPlan || !receipt) return;
    setLoading(true);
    try {
      await createSubscription(selectedPlan.name, selectedModels, selectedPlan.price);
      await submitPayment(selectedPlan.price, receipt);
      alert("Payment submitted successfully! An admin will verify your receipt soon.");
      onClose();
    } catch (error) {
      console.error("Error submitting payment:", error);
      alert("Failed to submit payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-bottom border-zinc-800 flex items-center justify-between bg-zinc-900/50 shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Novel AI Subscriptions</h2>
            <p className="text-zinc-400 text-xs md:text-sm">Choose a plan and select your favorite AI models</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 md:w-6 md:h-6 text-zinc-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-bottom border-zinc-800 px-4 md:px-6 overflow-x-auto no-scrollbar shrink-0">
          <button 
            onClick={() => setActiveTab('plans')}
            className={`py-3 md:py-4 px-4 md:px-6 text-xs md:text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'plans' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            1. Select Plan
            {activeTab === 'plans' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
          </button>
          <button 
            onClick={() => selectedPlan && setActiveTab('models')}
            disabled={!selectedPlan}
            className={`py-3 md:py-4 px-4 md:px-6 text-xs md:text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'models' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300 disabled:opacity-50'}`}
          >
            2. Choose Models
            {activeTab === 'models' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
          </button>
          <button 
            onClick={() => selectedPlan && selectedModels.length > 0 && setActiveTab('payment')}
            disabled={!selectedPlan || selectedModels.length === 0}
            className={`py-3 md:py-4 px-4 md:px-6 text-xs md:text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'payment' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300 disabled:opacity-50'}`}
          >
            3. Payment
            {activeTab === 'payment' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-950/30">
          <AnimatePresence mode="wait">
            {activeTab === 'plans' && (
              <motion.div 
                key="plans"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {FIXED_PLANS.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col ${selectedPlan?.id === plan.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <p className="text-zinc-400 text-sm mt-1">{plan.description}</p>
                    </div>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-white">
                        {plan.id === 'flexible' ? 'Usage-based' : `${plan.price} EGP`}
                      </span>
                      {plan.id !== 'flexible' && <span className="text-zinc-500 text-sm">/month</span>}
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                          <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button 
                      className={`w-full py-3 rounded-xl font-bold transition-all ${selectedPlan?.id === plan.id ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                    >
                      {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'models' && (
              <motion.div 
                key="models"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Zap className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Selected Models</p>
                      <p className="text-zinc-400 text-xs">{selectedModels.length} / {selectedPlan?.maxModels} models chosen</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('payment')}
                    disabled={selectedModels.length === 0}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold transition-all"
                  >
                    Continue to Payment
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableModels.map((model) => (
                    <div 
                      key={model.id}
                      onClick={() => toggleModel(model.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedModels.includes(model.id) ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}
                    >
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">{model.name}</h4>
                        <p className="text-zinc-500 text-xs mt-1 line-clamp-1">{model.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">
                            Context: {Math.round(model.context_length / 1000)}k
                          </span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${selectedModels.includes(model.id) ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700'}`}>
                        {selectedModels.includes(model.id) && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'payment' && (
              <motion.div 
                key="payment"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="max-w-xl mx-auto space-y-8"
              >
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CreditCard className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Vodafone Cash Payment</h3>
                    <p className="text-zinc-400 mt-2">
                      Please transfer <span className="text-white font-bold">
                        {selectedPlan?.id === 'flexible' ? 'Initial Deposit (e.g. 500)' : selectedPlan?.price} EGP
                      </span> to the following number:
                    </p>
                    {selectedPlan?.id === 'flexible' && (
                      <p className="text-xs text-zinc-500 mt-1 italic">* Flexible plans include a 20% profit margin on API costs.</p>
                    )}
                    <div className="mt-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center gap-3 group">
                      <span className="text-2xl font-mono font-bold text-emerald-500 tracking-wider">01012345678</span>
                      <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Check className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-zinc-300">Upload Transfer Receipt</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleReceiptUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${receipt ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/50 group-hover:border-zinc-700'}`}>
                      {receipt ? (
                        <div className="space-y-4">
                          <img src={receipt} alt="Receipt Preview" className="max-h-48 mx-auto rounded-lg shadow-lg" />
                          <p className="text-emerald-500 text-sm font-medium">Receipt uploaded successfully!</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-zinc-500 mx-auto" />
                          <p className="text-zinc-400 text-sm">Click or drag to upload your payment screenshot</p>
                          <p className="text-zinc-600 text-xs">PNG, JPG up to 1MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 p-4 rounded-xl border border-amber-500/20 flex gap-3">
                  <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Our team will verify your payment within 24 hours. Once approved, your selected models will be activated immediately.
                  </p>
                </div>

                <button 
                  onClick={handlePaymentSubmit}
                  disabled={!receipt || loading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Submit for Verification
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
