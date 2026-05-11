import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('dados');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Dados pessoais
  const [form, setForm] = useState({ name: '', email: '', phone: '', cpf: '' });

  // Endereços
  const [addresses, setAddresses] = useState([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ label: '', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
  const [editingAddr, setEditingAddr] = useState(null);
  const [cepLoading, setCepLoading] = useState(false);

  // Senha
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', cpf: user.cpf || '' });
  }, [user]);

  useEffect(() => { fetchAddresses(); }, []);

  async function fetchAddresses() {
    try {
      const { data } = await api.get('/auth/addresses');
      setAddresses(data);
    } catch {}
  }

  function showMsg(text, type = 'success') {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3500);
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/auth/update', form);
      updateUser(data.user);
      showMsg('Dados atualizados com sucesso!');
    } catch (err) {
      showMsg(err.response?.data?.error || 'Erro ao atualizar dados', 'error');
    } finally { setLoading(false); }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm_password) return showMsg('As senhas não coincidem', 'error');
    setLoading(true);
    try {
      await api.put('/auth/update', { current_password: passForm.current_password, password: passForm.new_password });
      showMsg('Senha alterada com sucesso!');
      setPassForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      showMsg(err.response?.data?.error || 'Erro ao alterar senha', 'error');
    } finally { setLoading(false); }
  }

  async function fetchCep(cep) {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const d = await res.json();
      if (!d.erro) setAddrForm(f => ({ ...f, street: d.logradouro, neighborhood: d.bairro, city: d.localidade, state: d.uf }));
    } catch {} finally { setCepLoading(false); }
  }

  async function handleSaveAddress(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAddr) {
        await api.put(`/auth/addresses/${editingAddr}`, addrForm);
        showMsg('Endereço atualizado!');
      } else {
        await api.post('/auth/addresses', addrForm);
        showMsg('Endereço adicionado!');
      }
      await fetchAddresses();
      setShowAddrForm(false);
      setEditingAddr(null);
      setAddrForm({ label: '', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
    } catch (err) {
      showMsg(err.response?.data?.error || 'Erro ao salvar endereço', 'error');
    } finally { setLoading(false); }
  }

  async function handleDeleteAddress(id) {
    if (!confirm('Remover este endereço?')) return;
    try {
      await api.delete(`/auth/addresses/${id}`);
      showMsg('Endereço removido!');
      fetchAddresses();
    } catch { showMsg('Erro ao remover', 'error'); }
  }

  function startEditAddr(addr) {
    setAddrForm({ label: addr.label || '', cep: addr.cep || '', street: addr.street || '', number: addr.number || '', complement: addr.complement || '', neighborhood: addr.neighborhood || '', city: addr.city || '', state: addr.state || '' });
    setEditingAddr(addr.id);
    setShowAddrForm(true);
  }

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="font-display text-3xl text-ruby-800 mb-2">Minha Conta</h1>
        <p className="text-ruby-500 mb-8">Gerencie seus dados e endereços</p>

        {/* Mensagem */}
        {msg.text && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-xl p-1 shadow-sm border border-ruby-100">
          {[{ id: 'dados', label: 'Dados Pessoais' }, { id: 'enderecos', label: 'Endereços' }, { id: 'senha', label: 'Segurança' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-ruby-600 text-white shadow-sm' : 'text-ruby-600 hover:bg-ruby-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Dados pessoais */}
        {tab === 'dados' && (
          <div className="card">
            <h2 className="font-display text-xl text-ruby-800 mb-6">Dados Pessoais</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ruby-700 mb-1">Nome completo</label>
                  <input className="input-ruby" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ruby-700 mb-1">E-mail</label>
                  <input className="input-ruby" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ruby-700 mb-1">CPF</label>
                  <input className="input-ruby bg-ruby-50" value={form.cpf} readOnly disabled title="CPF não pode ser alterado" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ruby-700 mb-1">Telefone / WhatsApp</label>
                  <input className="input-ruby" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="btn-ruby px-8">{loading ? 'Salvando...' : 'Salvar alterações'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Endereços */}
        {tab === 'enderecos' && (
          <div className="space-y-4">
            {addresses.map(addr => (
              <div key={addr.id} className="card flex items-start justify-between gap-4">
                <div>
                  {addr.label && <p className="font-semibold text-ruby-800 mb-1">{addr.label}</p>}
                  <p className="text-ruby-700 text-sm">{addr.street}, {addr.number}{addr.complement ? ` - ${addr.complement}` : ''}</p>
                  <p className="text-ruby-600 text-sm">{addr.neighborhood} — {addr.city}/{addr.state}</p>
                  <p className="text-ruby-500 text-sm">CEP: {addr.cep}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEditAddr(addr)} className="text-ruby-600 hover:text-ruby-800 text-sm underline">Editar</button>
                  <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-400 hover:text-red-600 text-sm underline">Remover</button>
                </div>
              </div>
            ))}

            {addresses.length === 0 && !showAddrForm && (
              <div className="card text-center py-10 text-ruby-400">
                <p className="mb-4">Nenhum endereço cadastrado</p>
              </div>
            )}

            {!showAddrForm ? (
              <button onClick={() => { setShowAddrForm(true); setEditingAddr(null); setAddrForm({ label: '', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' }); }} className="btn-ruby w-full">
                + Adicionar endereço
              </button>
            ) : (
              <div className="card">
                <h3 className="font-display text-lg text-ruby-800 mb-4">{editingAddr ? 'Editar endereço' : 'Novo endereço'}</h3>
                <form onSubmit={handleSaveAddress} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-ruby-700 mb-1">Identificação (ex: Casa, Trabalho)</label>
                    <input className="input-ruby" value={addrForm.label} onChange={e => setAddrForm(f => ({ ...f, label: e.target.value }))} placeholder="Ex: Casa" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-ruby-700 mb-1">CEP *</label>
                      <input className="input-ruby" value={addrForm.cep} onChange={e => { setAddrForm(f => ({ ...f, cep: e.target.value })); fetchCep(e.target.value); }} placeholder="00000-000" required />
                      {cepLoading && <p className="text-xs text-ruby-400 mt-1">Buscando CEP...</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ruby-700 mb-1">Estado *</label>
                      <input className="input-ruby" value={addrForm.state} onChange={e => setAddrForm(f => ({ ...f, state: e.target.value }))} placeholder="SP" maxLength={2} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ruby-700 mb-1">Rua/Logradouro *</label>
                    <input className="input-ruby" value={addrForm.street} onChange={e => setAddrForm(f => ({ ...f, street: e.target.value }))} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-ruby-700 mb-1">Número *</label>
                      <input className="input-ruby" value={addrForm.number} onChange={e => setAddrForm(f => ({ ...f, number: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ruby-700 mb-1">Complemento</label>
                      <input className="input-ruby" value={addrForm.complement} onChange={e => setAddrForm(f => ({ ...f, complement: e.target.value }))} placeholder="Apto, bloco..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-ruby-700 mb-1">Bairro *</label>
                      <input className="input-ruby" value={addrForm.neighborhood} onChange={e => setAddrForm(f => ({ ...f, neighborhood: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ruby-700 mb-1">Cidade *</label>
                      <input className="input-ruby" value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={loading} className="btn-ruby flex-1">{loading ? 'Salvando...' : 'Salvar endereço'}</button>
                    <button type="button" onClick={() => { setShowAddrForm(false); setEditingAddr(null); }} className="flex-1 py-2.5 px-4 border border-ruby-300 text-ruby-700 rounded-lg hover:bg-ruby-50 transition-colors">Cancelar</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Segurança */}
        {tab === 'senha' && (
          <div className="card">
            <h2 className="font-display text-xl text-ruby-800 mb-6">Alterar Senha</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ruby-700 mb-1">Senha atual</label>
                <input type="password" className="input-ruby" value={passForm.current_password} onChange={e => setPassForm(f => ({ ...f, current_password: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ruby-700 mb-1">Nova senha</label>
                <input type="password" className="input-ruby" value={passForm.new_password} onChange={e => setPassForm(f => ({ ...f, new_password: e.target.value }))} minLength={8} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ruby-700 mb-1">Confirmar nova senha</label>
                <input type="password" className="input-ruby" value={passForm.confirm_password} onChange={e => setPassForm(f => ({ ...f, confirm_password: e.target.value }))} required />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="btn-ruby px-8">{loading ? 'Salvando...' : 'Alterar senha'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
