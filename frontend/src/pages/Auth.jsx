import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiPhone } from 'react-icons/fi';
import { RiDiamondLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function formatCPF(v) {
  return v.replace(/\D/g,'').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
}

function formatPhone(v) {
  return v.replace(/\D/g,'').replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d{4})/,'$1-$2');
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Bem-vinda, ${user.name.split(' ')[0]}! 🌹`);
      navigate(redirect);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Visual side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-ruby-800 via-ruby-600 to-blush-400 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-blush-200 rounded-full blur-3xl" />
        </div>
        <div className="relative text-white text-center px-12">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
            <RiDiamondLine size={40} className="text-white" />
          </div>
          <h2 className="font-display text-5xl font-bold mb-4">Ruby</h2>
          <p className="font-body text-white/80 text-lg">Beleza sem limites,<br/>conforto em cada tamanho</p>
          <div className="flex justify-center gap-2 mt-8">
            {['🌹', '💕', '✨'].map((e, i) => (
              <span key={i} className="text-2xl opacity-70">{e}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-cream">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-ruby-600 rounded-full flex items-center justify-center">
              <RiDiamondLine className="text-white text-lg" />
            </div>
            <span className="font-display text-xl font-semibold text-ruby-700">Ruby - Moda Íntima</span>
          </div>

          <h1 className="font-display text-3xl font-semibold text-gray-900 mb-1">Bem-vinda de volta!</h1>
          <p className="text-gray-500 font-body mb-8">Entre na sua conta para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-ruby">E-mail</label>
              <div className="relative">
                <FiMail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  className="input-ruby pl-10"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-ruby">Senha</label>
              <div className="relative">
                <FiLock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-ruby pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-ruby w-full py-4 text-base mt-2">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 font-body mt-6">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-ruby-600 font-semibold hover:text-ruby-700">
              Criar agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', cpf: '', phone: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('As senhas não coincidem'); return;
    }
    if (form.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres'); return;
    }
    setLoading(true);
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        cpf: form.cpf.replace(/\D/g,''),
        phone: form.phone.replace(/\D/g,'')
      });
      toast.success(`Conta criada! Bem-vinda, ${user.name.split(' ')[0]}! 🌹`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-ruby-800 via-ruby-600 to-blush-400 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative text-white text-center px-12">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
            <RiDiamondLine size={40} className="text-white" />
          </div>
          <h2 className="font-display text-5xl font-bold mb-4">Ruby</h2>
          <p className="font-body text-white/80 text-lg">Crie sua conta e descubra<br/>o melhor da moda íntima plus size</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-cream overflow-y-auto">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl font-semibold text-gray-900 mb-1">Criar Conta</h1>
          <p className="text-gray-500 font-body mb-7">Junte-se à nossa comunidade</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-ruby">Nome Completo *</label>
              <div className="relative">
                <FiUser size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" className="input-ruby pl-10" placeholder="Seu nome"
                  value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
              </div>
            </div>

            <div>
              <label className="label-ruby">E-mail *</label>
              <div className="relative">
                <FiMail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" className="input-ruby pl-10" placeholder="seu@email.com"
                  value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
              </div>
            </div>

            <div>
              <label className="label-ruby">CPF *</label>
              <input className="input-ruby" placeholder="000.000.000-00" maxLength={14}
                value={formatCPF(form.cpf)} onChange={e => setForm(f => ({...f, cpf: e.target.value.replace(/\D/g,'')}))} required />
            </div>

            <div>
              <label className="label-ruby">Telefone / WhatsApp</label>
              <div className="relative">
                <FiPhone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input-ruby pl-10" placeholder="(00) 00000-0000" maxLength={15}
                  value={formatPhone(form.phone)} onChange={e => setForm(f => ({...f, phone: e.target.value.replace(/\D/g,'')}))} />
              </div>
            </div>

            <div>
              <label className="label-ruby">Senha *</label>
              <div className="relative">
                <FiLock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} className="input-ruby pl-10 pr-10" placeholder="Mínimo 6 caracteres"
                  value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label-ruby">Confirmar Senha *</label>
              <div className="relative">
                <FiLock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" className="input-ruby pl-10" placeholder="Confirme sua senha"
                  value={form.confirmPassword} onChange={e => setForm(f => ({...f, confirmPassword: e.target.value}))} required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-ruby w-full py-4 text-base mt-2">
              {loading ? 'Criando conta...' : 'Criar Conta Grátis'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 font-body mt-5">
            Já tem conta?{' '}
            <Link to="/login" className="text-ruby-600 font-semibold hover:text-ruby-700">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Auth({ defaultTab }) {
  const [tab, setTab] = useState(defaultTab || 'login');
  return tab === 'login' ? <Login onSwitch={() => setTab('register')} /> : <Register onSwitch={() => setTab('login')} />;
}
