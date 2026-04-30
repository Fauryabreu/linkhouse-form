import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
  label: string;
  value: string;
  points: number;
  disqualify?: boolean;
}

interface Question {
  id: string;
  title: string;
  subtitle: string;
  options: Option[];
}

interface ContactData {
  nombre: string;
  whatsapp: string;
  email: string;
  nacionalidad: string;
}

type Screen = 'questions' | 'contact' | 'qualified' | 'disqualified';

const QUESTIONS: Question[] = [
  {
    id: 'objetivo',
    title: '¿Cuál es tu objetivo principal?',
    subtitle: 'Selecciona la opción que mejor describe tu meta',
    options: [
      { label: 'Aprender inglés', value: 'Aprender inglés', points: 20 },
      { label: 'Estudiar educación superior', value: 'Estudiar educación superior', points: 25 },
      { label: 'Trabajar en el exterior', value: 'Trabajar en el exterior', points: 22 },
      { label: 'Migrar a largo plazo', value: 'Migrar a largo plazo', points: 25 },
      { label: 'Vivir una experiencia diferente', value: 'Vivir una experiencia diferente', points: 18 },
      { label: 'Aún no lo tengo claro', value: 'Aún no lo tengo claro', points: 0, disqualify: true },
    ],
  },
  {
    id: 'nivelEstudios',
    title: '¿Cuál es tu nivel de estudios?',
    subtitle: 'Tu formación académica más reciente',
    options: [
      { label: 'Bachillerato / Secundaria', value: 'Bachillerato / Secundaria', points: 15 },
      { label: 'Técnico o Tecnólogo', value: 'Técnico o Tecnólogo', points: 18 },
      { label: 'Universidad Pregrado', value: 'Universidad Pregrado', points: 22 },
      { label: 'Posgrado', value: 'Posgrado', points: 25 },
      { label: 'No tengo estudios completados', value: 'No tengo estudios completados', points: 0, disqualify: true },
    ],
  },
  {
    id: 'presupuesto',
    title: '¿Cuál es tu situación con el presupuesto?',
    subtitle: 'Sé honesto, esto nos ayuda a darte la mejor opción',
    options: [
      { label: 'Ya tengo el presupuesto listo', value: 'Ya tengo el presupuesto listo', points: 30 },
      { label: 'Estoy organizando mi presupuesto', value: 'Estoy organizando mi presupuesto', points: 20 },
      { label: 'Necesito financiamiento', value: 'Necesito financiamiento', points: 10 },
      { label: 'Solo estoy explorando', value: 'Solo estoy explorando', points: 0, disqualify: true },
    ],
  },
  {
    id: 'cuando',
    title: '¿Cuándo quieres comenzar tu viaje?',
    subtitle: 'Cuéntanos tu disponibilidad aproximada',
    options: [
      { label: 'Lo antes posible (0–3 meses)', value: 'Lo antes posible (0–3 meses)', points: 25 },
      { label: 'En los próximos 6 meses', value: 'En los próximos 6 meses', points: 20 },
      { label: 'En un año', value: 'En un año', points: 10 },
      { label: 'Solo estoy explorando', value: 'Solo estoy explorando', points: 0, disqualify: true },
    ],
  },
  {
    id: 'edad',
    title: '¿Cuál es tu rango de edad?',
    subtitle: 'Esta información nos ayuda a personalizar tu plan',
    options: [
      { label: '16 a 21 años', value: '16 a 21 años', points: 22 },
      { label: '22 a 30 años', value: '22 a 30 años', points: 25 },
      { label: '31 a 40 años', value: '31 a 40 años', points: 20 },
      { label: '41 a 50 años', value: '41 a 50 años', points: 12 },
      { label: 'Más de 50 años', value: 'Más de 50 años', points: 0, disqualify: true },
    ],
  },
];

const NATIONALITIES = ['Colombia', 'México', 'Chile', 'Perú', 'Argentina', 'Ecuador', 'España', 'Otro'];
const WHATSAPP_NUMBER = '18298165153';
const SCORE_THRESHOLD = 85;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const variants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: 'easeOut' as const } },
  exit: { x: -60, opacity: 0, transition: { duration: 0.22, ease: 'easeIn' as const } },
};

export default function LeadForm() {
  const [screen, setScreen] = useState<Screen>('questions');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [disqualified, setDisqualified] = useState(false);
  const [contactData, setContactData] = useState<ContactData>({
    nombre: '',
    whatsapp: '',
    email: '',
    nacionalidad: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);

  const totalSteps = QUESTIONS.length + 1;
  const progressStep = screen === 'questions' ? currentQuestion + 1 : totalSteps;
  const progress = (progressStep / totalSteps) * 100;

  const handleOptionSelect = (questionId: string, option: Option) => {
    if (selectedOption !== null) return;

    setSelectedOption(option.value);
    setAnswers((prev) => ({ ...prev, [questionId]: option.value }));

    if (option.disqualify) setDisqualified(true);

    setTimeout(() => {
      setSelectedOption(null);
      if (currentQuestion < QUESTIONS.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        setScreen('contact');
      }
    }, 350);
  };

  const calculateScore = (): number => {
    let total = 0;
    QUESTIONS.forEach((q) => {
      const selected = q.options.find((o) => o.value === answers[q.id]);
      if (selected && !selected.disqualify) total += selected.points;
    });
    return total;
  };

  const firePixel = (finalScore: number) => {
    window.fbq?.('trackCustom', 'RegistroDeFormulario', {
      lead_status: 'qualified',
      lead_score: finalScore,
      service_interest: answers['objetivo'],
      source: 'meta_ads',
      form_name: 'linkhouse-offshore-prueba',
    });
  };

  const callCAPI = async (finalScore: number) => {
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contactData.email,
          phone: contactData.whatsapp,
          score: finalScore,
          objetivo: answers['objetivo'],
          nombre: contactData.nombre,
          nacionalidad: contactData.nacionalidad,
        }),
      });
    } catch {
      // pixel already fired — silent fail
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (disqualified) {
      setScreen('disqualified');
      setIsLoading(false);
      return;
    }

    const finalScore = calculateScore();
    setScore(finalScore);

    if (finalScore >= SCORE_THRESHOLD) {
      firePixel(finalScore);
      await callCAPI(finalScore);
      setScreen('qualified');
    } else {
      setScreen('disqualified');
    }

    setIsLoading(false);
  };

  const buildWhatsAppUrl = (): string => {
    const msg =
      `¡Hola LinkHouse! 👋\n\nAcabo de completar el formulario de calificación.\n\n` +
      `*Mis datos:*\n` +
      `👤 Nombre: ${contactData.nombre}\n` +
      `📱 WhatsApp: ${contactData.whatsapp}\n` +
      `📧 Email: ${contactData.email}\n` +
      `🌎 Nacionalidad: ${contactData.nacionalidad}\n\n` +
      `*Mi perfil:*\n` +
      `🎯 Objetivo: ${answers.objetivo}\n` +
      `📚 Estudios: ${answers.nivelEstudios}\n` +
      `💰 Presupuesto: ${answers.presupuesto}\n` +
      `📅 Inicio: ${answers.cuando}\n` +
      `🎂 Edad: ${answers.edad}\n\n` +
      `⭐ Puntaje: ${score}/130\n\n` +
      `Me gustaría conocer más sobre sus programas. ¡Gracias!`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const firstName = contactData.nombre.split(' ')[0];

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <span className="text-3xl font-bold text-gold tracking-tight">LinkHouse</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-navy-light rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        {(screen === 'questions' || screen === 'contact') && (
          <div className="h-1 bg-navy-dark">
            <motion.div
              className="h-full bg-gold"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        )}

        <div className="p-8 md:p-10">
          <AnimatePresence mode="wait">
            {/* ── Questions ── */}
            {screen === 'questions' && (
              <motion.div
                key={`q-${currentQuestion}`}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">
                  Paso {currentQuestion + 1} de {totalSteps}
                </p>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1 leading-snug">
                  {QUESTIONS[currentQuestion].title}
                </h2>
                <p className="text-sm text-gray-400 mb-7">
                  {QUESTIONS[currentQuestion].subtitle}
                </p>
                <div className="space-y-3">
                  {QUESTIONS[currentQuestion].options.map((option) => {
                    const isSelected = selectedOption === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleOptionSelect(QUESTIONS[currentQuestion].id, option)
                        }
                        disabled={selectedOption !== null}
                        className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium
                          transition-all duration-200 active:scale-[0.98] disabled:cursor-default
                          ${
                            isSelected
                              ? 'border-gold bg-gold/10 text-gold'
                              : 'border-white/10 bg-white/5 text-white hover:border-gold/40 hover:bg-gold/5'
                          }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Contact Form ── */}
            {screen === 'contact' && (
              <motion.div
                key="contact"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">
                  Paso {totalSteps} de {totalSteps}
                </p>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1">¡Casi listo!</h2>
                <p className="text-sm text-gray-400 mb-7">
                  Cuéntanos a quién enviarle el plan personalizado
                </p>

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Nombre completo</label>
                    <input
                      type="text"
                      required
                      value={contactData.nombre}
                      onChange={(e) =>
                        setContactData({ ...contactData, nombre: e.target.value })
                      }
                      placeholder="Tu nombre completo"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                        text-white text-sm placeholder-gray-600
                        focus:outline-none focus:border-gold/50 focus:bg-white/8
                        transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      Número de WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactData.whatsapp}
                      onChange={(e) =>
                        setContactData({ ...contactData, whatsapp: e.target.value })
                      }
                      placeholder="+57 300 000 0000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                        text-white text-sm placeholder-gray-600
                        focus:outline-none focus:border-gold/50
                        transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={contactData.email}
                      onChange={(e) =>
                        setContactData({ ...contactData, email: e.target.value })
                      }
                      placeholder="tu@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                        text-white text-sm placeholder-gray-600
                        focus:outline-none focus:border-gold/50
                        transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Nacionalidad</label>
                    <div className="relative">
                      <select
                        required
                        value={contactData.nacionalidad}
                        onChange={(e) =>
                          setContactData({ ...contactData, nacionalidad: e.target.value })
                        }
                        className="w-full appearance-none bg-navy-dark border border-white/10 rounded-xl
                          px-4 py-3 text-white text-sm
                          focus:outline-none focus:border-gold/50
                          transition-colors cursor-pointer"
                      >
                        <option value="" disabled className="bg-navy-dark text-gray-400">
                          Selecciona tu país
                        </option>
                        {NATIONALITIES.map((n) => (
                          <option key={n} value={n} className="bg-navy-dark">
                            {n}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 bg-gold hover:bg-gold-dark text-navy font-bold py-3.5 px-6
                      rounded-xl transition-all duration-200 active:scale-[0.98]
                      disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoading ? 'Procesando...' : 'Ver mi resultado →'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── Qualified ── */}
            {screen === 'qualified' && (
              <motion.div
                key="qualified"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 bg-gold/15 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <span className="text-3xl">🎉</span>
                </motion.div>

                <h2 className="text-2xl font-bold text-white mb-5">
                  ¡Felicitaciones, {firstName || contactData.nombre}!
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed mb-3">
                  Diste el primer paso hacia tu experiencia internacional.
                  Ahora falta uno solo: conectar con tu asesor.
                </p>
                <p className="text-sm text-gray-400 leading-relaxed mb-8">
                  Presiona el botón de abajo para iniciar la conversación.
                  Es el paso más importante — si no lo haces, no podremos acompañarte
                  en este proceso y sería una pena que tu historia no empiece aquí.
                </p>

                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 w-full
                    bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold
                    py-4 px-6 rounded-xl transition-all duration-200 active:scale-[0.98] text-sm"
                >
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Hablar con mi asesor ahora →
                </a>

                <p className="text-xs text-gray-500 mt-4">
                  Solo toma 30 segundos. Tu asesor ya está esperando.
                </p>
              </motion.div>
            )}

            {/* ── Disqualified ── */}
            {screen === 'disqualified' && (
              <motion.div
                key="disqualified"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🙏</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-4">Gracias por tu tiempo</h2>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                  En este momento no somos la mejor opción para tu perfil.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-700">© 2025 LinkHouse. Todos los derechos reservados.</p>
    </div>
  );
}
