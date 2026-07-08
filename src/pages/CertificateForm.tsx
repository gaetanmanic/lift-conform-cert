import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Camera, 
  MapPin, 
  Upload, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Download, 
  Save,
  Image as ImageIcon,
  RotateCcw,
  Plus
} from 'lucide-react';
import { useStore, Certificate } from '../store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CertificateForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser, settings, addCertificate, updateCertificate, getNextCertId, certificates } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const versoRef = useRef<HTMLDivElement>(null);

  // Form State
  const [form, setForm] = useState<Omit<Certificate, 'id'>>({
    uniqueId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    location: 'Récupération du GPS...',
    userName: currentUser?.name || '',
    equipmentPhoto: '',
    logoUrl: 'https://storage.googleapis.com/dala-prod-public-storage/generated-images/600341d3-5b02-41e2-848f-b8732aa88749/amphy-theatre-logo-cc7fb9ff-1783530932595.webp',
    companyName: '',
    companyAddress: '',
    companyContact: '',
    qrCodeData: '',
    appreciation: settings.dropdownOptions.appreciations[0],
    observations: settings.dropdownOptions.observations[0],
    certifierName: settings.certifyingCompany.name,
    certifierLaw: settings.certifyingCompany.law,
    certifierContact: settings.certifyingCompany.contacts,
    versoPhotos: [],
  });

  // Load existing data if edit mode
  useEffect(() => {
    if (id) {
      const cert = certificates.find(c => c.id === id);
      if (cert) {
        setIsEditMode(true);
        setForm(cert);
      }
    } else {
      // Get GPS Location and Auto-ID only for new certs
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setForm(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
          },
          (error) => {
            toast.error("Impossible de récupérer la position GPS. Veuillez l'autoriser.");
            setForm(prev => ({ ...prev, location: "Localisation non disponible" }));
          }
        );
      }
      const nextId = getNextCertId();
      setForm(prev => ({ ...prev, uniqueId: nextId }));
    }
  }, [id, getNextCertId, certificates]);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'verso') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'front') {
        setForm(prev => ({ ...prev, equipmentPhoto: base64 }));
      } else {
        setForm(prev => ({ ...prev, versoPhotos: [...prev.versoPhotos, base64] }));
      }
    };
    reader.readAsDataURL(file);
  };

  const removeVersoPhoto = (index: number) => {
    setForm(prev => ({
      ...prev,
      versoPhotos: prev.versoPhotos.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    setLoading(true);
    try {
      if (isEditMode && id) {
        updateCertificate(id, form);
        toast.success('Certificat mis à jour avec succès');
      } else {
        addCertificate(form);
        toast.success('Certificat enregistré dans l\'historique');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!pdfRef.current) return;
    setIsGeneratingPdf(true);
    setLoading(true);

    try {
      // 1. Generate QR Code Data (String representation for the QR)
      const qrData = JSON.stringify({
        id: form.uniqueId,
        loc: form.location,
        date: form.date,
        time: form.time,
        user: form.userName
      });
      setForm(prev => ({ ...prev, qrCodeData: qrData }));

      // Small delay to ensure QR and images are rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Capture Page 1 (Recto)
      const rectoCanvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const rectoImg = rectoCanvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(rectoImg, 'JPEG', 0, 0, 210, 297);

      // Capture Page 2 (Verso)
      if (versoRef.current) {
        pdf.addPage();
        const versoCanvas = await html2canvas(versoRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const versoImg = versoCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(versoImg, 'JPEG', 0, 0, 210, 297);
      }

      // Save PDF
      pdf.save(`CERT_CONFORMITE_${form.uniqueId}.pdf`);
      
      // If not already saved, save it now
      if (!isEditMode) {
        addCertificate(form);
      } else if (id) {
        updateCertificate(id, form);
      }
      
      toast.success('Certificat généré et enregistré !');
      navigate('/user');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPdf(false);
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Info Entreprise', icon: ImageIcon },
    { title: 'Équipement', icon: Camera },
    { title: 'Certification', icon: Check },
    { title: 'Photos Suppl.', icon: Plus },
    { title: 'Aperçu', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-40">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-bold text-slate-900 uppercase">{isEditMode ? 'Modifier' : 'Nouveau'} Certificat</h1>
        <div className="w-10"></div>
      </div>

      {/* Progress Stepper */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between max-w-lg mx-auto relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
          {steps.map((s, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                ${step > idx + 1 ? 'bg-primary text-white' : step === idx + 1 ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-white border-2 border-slate-200 text-slate-400'}
              `}>
                {step > idx + 1 ? <Check className="w-5 h-5" /> : idx + 1}
              </div>
              <span className={`text-[10px] mt-2 font-bold uppercase tracking-tighter ${step === idx + 1 ? 'text-primary' : 'text-slate-400'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Step 1: Company Info */}
        {step === 1 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CardHeader>
              <CardTitle>Informations du client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de l'entreprise cliente</Label>
                <Input 
                  placeholder="EX: GÉBÉYA CONSTRUCTION" 
                  value={form.companyName}
                  onChange={e => setForm({...form, companyName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Adresse / Siège</Label>
                <Input 
                  placeholder="Douala, Cameroun" 
                  value={form.companyAddress}
                  onChange={e => setForm({...form, companyAddress: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Client</Label>
                <Input 
                  placeholder="+237 6XX XXX XXX" 
                  value={form.companyContact}
                  onChange={e => setForm({...form, companyContact: e.target.value})}
                />
              </div>
              <div className="p-4 bg-slate-50 rounded-lg space-y-2 border border-slate-200 mt-6">
                <div className="flex items-center text-xs text-slate-500">
                  <MapPin className="w-3 h-3 mr-1" /> {form.location}
                </div>
                <div className="text-xs font-mono font-bold text-primary">
                  ID: {form.uniqueId} | {form.date} | {form.time}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => setStep(2)}>Suivant</Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Equipment Photo */}
        {step === 2 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CardHeader>
              <CardTitle>Photo de l'appareil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={`
                aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative
                ${form.equipmentPhoto ? 'border-none ring-2 ring-primary' : ''}
              `}>
                {form.equipmentPhoto ? (
                  <>
                    <img src={form.equipmentPhoto} className="w-full h-full object-cover" alt="Equipement" />
                    <button 
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg"
                      onClick={() => setForm({...form, equipmentPhoto: ''})}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <Camera className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm mb-4">Ajoutez la photo principale de l'appareil de levage</p>
                    <div className="flex space-x-2 justify-center">
                      <Label htmlFor="front-cam" className="cursor-pointer bg-primary text-white px-4 py-2 rounded-lg flex items-center text-sm font-bold">
                        <Camera className="w-4 h-4 mr-2" /> Filmer
                      </Label>
                      <Label htmlFor="front-gal" className="cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-lg flex items-center text-sm font-bold">
                        <Upload className="w-4 h-4 mr-2" /> Galerie
                      </Label>
                    </div>
                    <input id="front-cam" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(e, 'front')} />
                    <input id="front-gal" type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'front')} />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Précédent</Button>
              <Button className="flex-1" onClick={() => setStep(3)} disabled={!form.equipmentPhoto}>Suivant</Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Certification Details */}
        {step === 3 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CardHeader>
              <CardTitle>Résultats de l'inspection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Appréciation</Label>
                <Select value={form.appreciation} onValueChange={v => setForm({...form, appreciation: v})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir une appréciation" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.dropdownOptions.appreciations.map((opt, i) => (
                      <SelectItem key={i} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observations</Label>
                <Select value={form.observations} onValueChange={v => setForm({...form, observations: v})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir une observation" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.dropdownOptions.observations.map((opt, i) => (
                      <SelectItem key={i} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-800 leading-relaxed">
                <strong>Note:</strong> Ces informations seront enregistrées automatiquement et apparaîtront dans le corps du certificat.
              </div>
            </CardContent>
            <CardFooter className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Précédent</Button>
              <Button className="flex-1" onClick={() => setStep(4)}>Suivant</Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Verso Photos */}
        {step === 4 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CardHeader>
              <CardTitle>Photos Verso (Photos sup.)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {form.versoPhotos.map((photo, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden ring-1 ring-slate-200">
                    <img src={photo} className="w-full h-full object-cover" alt={`Verso ${i}`} />
                    <button 
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                      onClick={() => removeVersoPhoto(i)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {form.versoPhotos.length < 4 && (
                  <Label className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <Plus className="w-8 h-8 text-slate-300 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Ajouter</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'verso')} />
                  </Label>
                )}
              </div>
              <p className="text-xs text-slate-500 text-center italic">Ces photos apparaîtront au verso du document.</p>
            </CardContent>
            <CardFooter className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Précédent</Button>
              <Button className="flex-1" onClick={() => setStep(5)}>Prévisualiser</Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 5: Final Preview & Export */}
        {step === 5 && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col space-y-4">
               <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
                 <p className="text-sm font-medium text-slate-900">Tout est prêt !</p>
                 <p className="text-xs text-slate-500">Vérifiez les informations ci-dessous avant d'exporter en PDF.</p>
               </div>
               
               <div className="grid grid-cols-1 gap-3">
                 <Button variant="outline" className="w-full h-12" onClick={() => setStep(4)}>Continuer à modifier</Button>
                 <Button variant="secondary" className="w-full h-12 font-bold" onClick={handleSave} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" /> Enregistrer les champs
                 </Button>
                 <Button className="w-full h-14 shadow-lg shadow-primary/20 font-extrabold text-lg" onClick={handleGeneratePdf} disabled={loading}>
                   {loading ? 'Génération...' : <><Download className="w-5 h-5 mr-2" /> Imprimer le Certificat</>}
                 </Button>
               </div>
            </div>

            {/* Hidden Certificate Container for PDF capture */}
            <div className="overflow-hidden h-0 opacity-0 pointer-events-none">
              <div 
                ref={pdfRef}
                style={{
                  width: '210mm',
                  height: '297mm',
                  padding: '15mm',
                  background: 'white',
                  fontFamily: 'system-ui, sans-serif',
                  position: 'relative',
                  boxSizing: 'border-box'
                }}
              >
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginBottom: '4px' }}>ID CERTIFICAT: #{form.uniqueId}</div>
                    <div style={{ color: '#64748b' }}>Date: {form.date} | Heure: {form.time}</div>
                    <div style={{ color: '#64748b' }}>Lieu: {form.location}</div>
                    <div style={{ color: '#64748b' }}>Utilisateur: {form.userName}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <img src={form.logoUrl} style={{ height: '60px', objectFit: 'contain' }} alt="Logo" />
                    <div style={{ marginTop: '10px', fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold' }}>{form.companyName}</div>
                      <div style={{ color: '#64748b' }}>{form.companyAddress}</div>
                      <div style={{ color: '#64748b' }}>{form.companyContact}</div>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '30px', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a', padding: '15px 0' }}>
                  <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', color: '#0f172a' }}>
                    Certificat de Conformité
                  </h1>
                </div>

                {/* Main Photo Section */}
                <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '350px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f8fafc'
                  }}>
                    {form.equipmentPhoto && (
                      <img src={form.equipmentPhoto} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    )}
                  </div>
                </div>

                {/* QR Code and Results */}
                <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
                  <div style={{ width: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                       <QRCodeSVG 
                         value={JSON.stringify({id: form.uniqueId, loc: form.location, date: form.date, user: form.userName})} 
                         size={120}
                        />
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '8px', color: '#64748b', textAlign: 'center' }}>
                      Scanner pour vérification numérique
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569', marginBottom: '5px' }}>Appréciation</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{form.appreciation}</div>
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569', marginBottom: '5px' }}>Observations</div>
                      <div style={{ fontSize: '16px', color: '#0f172a', lineHeight: '1.4' }}>{form.observations}</div>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                   <div style={{ textAlign: 'center', fontSize: '12px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{form.certifierName}</div>
                      <div style={{ color: '#64748b', fontStyle: 'italic', marginBottom: '8px', maxWidth: '80%', margin: '0 auto 8px' }}>{form.certifierLaw}</div>
                      <div style={{ fontWeight: 'medium', color: '#0f172a' }}>{form.certifierContact}</div>
                   </div>
                </div>
              </div>

              {/* Verso Page Capture */}
              {form.versoPhotos.length > 0 && (
                <div 
                  ref={versoRef}
                  style={{
                    width: '210mm',
                    height: '297mm',
                    padding: '15mm',
                    background: 'white',
                    fontFamily: 'system-ui, sans-serif',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                    <h2 style={{ fontSize: '18px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>Vues Supplémentaires - #{form.uniqueId}</h2>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '20px',
                    height: 'calc(100% - 100px)'
                  }}>
                    {form.versoPhotos.map((photo, i) => (
                      <div key={i} style={{ 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px', 
                        overflow: 'hidden',
                        height: '350px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f8fafc'
                      }}>
                        <img src={photo} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile-friendly Preview for the user */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 space-y-6">
              <div className="flex justify-between items-start">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Aperçu du Certificat</div>
                <div className="text-xs font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">#{form.uniqueId}</div>
              </div>

              <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-100 shadow-inner bg-slate-50">
                 {form.equipmentPhoto && <img src={form.equipmentPhoto} className="w-full h-full object-cover" alt="Preview" />}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Client</div>
                  <div className="text-sm font-bold text-slate-900">{form.companyName || 'Non renseigné'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Résultat</div>
                  <div className="text-sm font-bold text-slate-900">{form.appreciation}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                   <div className="p-1.5 bg-slate-100 rounded">
                     <QRCodeSVG value="preview" size={40} />
                   </div>
                   <div className="text-[10px] text-slate-400 leading-tight">QR Code<br/>Prêt</div>
                </div>
                <div className="flex -space-x-2">
                   {form.versoPhotos.map((_, i) => (
                     <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center">
                        <ImageIcon className="w-3 h-3 text-slate-400" />
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Steps indicators for mobile bottom */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-center space-x-2 md:hidden">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i + 1 ? 'w-8 bg-primary' : 'w-2 bg-slate-200'}`}></div>
        ))}
      </div>
    </div>
  );
}
