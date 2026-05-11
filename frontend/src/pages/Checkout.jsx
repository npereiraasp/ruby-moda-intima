import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiCreditCard, FiCheck, FiMapPin, FiPlus } from 'react-icons/fi';
import { RiQrCodeLine } from 'react-icons/ri';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

function formatPrice(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function formatCPF(v) { return v.replace(/\D/g,'').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4'); }
function formatCEP(v) { return v.replace(/\D/g,'').replace(/(\d{5})(\d{3})/,'$1-$2'); }

export default function Checkout() {
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=address 2=payment 3=confirm
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '', installments: 1 });
  const [newAddress, setNewAddress] = useState({ label:'', cep:'', street:'', number:'', complement:'', neighborhood:'', city:'', state:'' });
  const [addingAddress, setAddingAddress] = useState(false);
  const [order, setOrder] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login?redirect=/checkout'); return; }
    if (items.length === 0) { navigate('/carrinho'); return; }
    api.get('/api/auth/me').then(r => {
      setAddresses(r.data.addresses || []);
      const def = r.data.addresses?.find(a => a.is_default);
      if (def) setSelectedAddress(def.id);
    });
  }, []);

  const fetchCEP = async (cep) => {
    const clean = cep.replace(/\D/g,'');
    if (clean.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setNewAddress(a => ({ ...a, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }));
      }
    } catch {}
    setLoadingCep(false);
  };

  const saveAddress = async () => {
    try {
      const res = await api.post('/api/auth/address', { ...newAddress, is_default: addresses.length === 0 });
      const updated = [...addresses, res.data];
      setAddresses(updated);
      setSelectedAddress(res.data.id);
      setAddingAddress(false);
      setNewAddress({ label:'', cep:'', street:'', number:'', complement:'', neighborhood:'', city:'', state:'' });
      toast.success('Endereço salvo!');
    } catch {
      toast.error('Erro ao salvar endereço');
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) { toast.error('Selecione um endereço'); return; }
    setPlacing(true);
    try {
      const res = await api.post('/api/orders', {
        items: items.map(i => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity })),
        address_id: selectedAddress,
        payment_method: paymentMethod,
      });
      setOrder(res.data);
      setStep(3);
      clearCart();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao finalizar pedido');
    } finally {
      setPlacing(false);
    }
  };

  // Step 3: Order success
  if (step === 3 && order) {
    return (
      <div className="page-container py-12 max-w-2xl mx-auto">
        <div className="card p-10 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheck className="text-green-600" size={36} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-gray-900 mb-2">Pedido Realizado! 🎉</h1>
          <p className="text-gray-500 font-body mb-2">
            Pedido #{order.id?.slice(0,8).toUpperCase()}
          </p>

          {order.payment_method === 'pix' && order.pix_info && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mt-6 mb-6 text-left">
              <h3 className="font-body font-semibold text-green-800 mb-3 flex items-center gap-2">
                <RiQrCodeLine size={20} /> Pague via PIX
              </h3>
              <div className="bg-white rounded-xl p-4 text-center mb-4">
                <div className="w-32 h-32 bg-gray-100 rounded-xl mx-auto flex items-center justify-center text-4xl mb-2">
                  <RiQrCodeLine size={60} className="text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-2">QR Code PIX (integre Mercado Pago para gerar)</p>
              </div>
              <div className="space-y-2 text-sm font-body">
                <div className="flex justify-between"><span className="text-gray-600">Chave PIX:</span><strong>{order.pix_info.key || 'Configure nas settings'}</strong></div>
                <div className="flex justify-between"><span className="text-gray-600">Beneficiário:</span><strong>{order.pix_info.beneficiary}</strong></div>
                <div className="flex justify-between"><span className="text-gray-600">Valor:</span><strong className="text-ruby-600">{formatPrice(order.pix_info.amount)}</strong></div>
                <div className="flex justify-between"><span className="text-gray-600">Validade:</span><strong>{new Date(order.pix_info.expires_at).toLocaleString('pt-BR')}</strong></div>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">Após o pagamento, confirmaremos em até 1 hora útil</p>
            </div>
          )}

          {order.payment_method === 'credit_card' && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6 mb-6">
              <FiCreditCard size={32} className="text-blue-600 mx-auto mb-3" />
              <p className="font-body text-blue-800">Pagamento no cartão de crédito</p>
              <p className="text-sm text-blue-600 mt-1">Processamento em andamento...</p>
              <p className="text-xs text-blue-500 mt-1">(Integre Mercado Pago SDK para processar cartões)</p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Link to="/meus-pedidos" className="btn-ruby">Ver Meus Pedidos</Link>
            <Link to="/" className="btn-outline">Continuar Comprando</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-8 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-semibold text-gray-900 mb-7">Finalizar Compra</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[{n:1,label:'Endereço'},{n:2,label:'Pagamento'}].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 cursor-pointer ${step >= s.n ? 'text-ruby-600' : 'text-gray-400'}`}
              onClick={() => step > s.n && setStep(s.n)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all ${step > s.n ? 'bg-ruby-600 border-ruby-600 text-white' : step === s.n ? 'border-ruby-600 text-ruby-600' : 'border-gray-300 text-gray-400'}`}>
                {step > s.n ? <FiCheck size={14} /> : s.n}
              </div>
              <span className="font-body font-medium text-sm hidden sm:block">{s.label}</span>
            </div>
            {i < 1 && <div className={`h-px w-10 ${step > s.n ? 'bg-ruby-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="font-body font-semibold text-gray-900 text-lg mb-5 flex items-center gap-2">
                <FiMapPin className="text-ruby-500" /> Endereço de Entrega
              </h2>

              {addresses.length > 0 && (
                <div className="space-y-3 mb-5">
                  {addresses.map(addr => (
                    <label key={addr.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress === addr.id ? 'border-ruby-500 bg-ruby-50' : 'border-gray-200 hover:border-ruby-200'}`}>
                      <input type="radio" name="address" value={addr.id} checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)} className="mt-1 accent-ruby-600" />
                      <div className="text-sm font-body">
                        <p className="font-semibold text-gray-900">{addr.label}</p>
                        <p className="text-gray-600">{addr.street}, {addr.number}{addr.complement ? ` - ${addr.complement}` : ''}</p>
                        <p className="text-gray-600">{addr.neighborhood} - {addr.city}/{addr.state}</p>
                        <p className="text-gray-500">CEP: {addr.cep}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {!addingAddress ? (
                <button onClick={() => setAddingAddress(true)} className="btn-outline w-full flex items-center justify-center gap-2">
                  <FiPlus size={16} /> Adicionar novo endereço
                </button>
              ) : (
                <div className="border border-gray-200 rounded-xl p-5 space-y-4">
                  <h3 className="font-body font-medium text-gray-900 text-sm">Novo Endereço</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-ruby">CEP *</label>
                      <input
                        className="input-ruby"
                        placeholder="00000-000"
                        value={formatCEP(newAddress.cep)}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g,'');
                          setNewAddress(a => ({...a, cep: v}));
                          if (v.length === 8) fetchCEP(v);
                        }}
                        maxLength={9}
                      />
                    </div>
                    <div>
                      <label className="label-ruby">Identificação</label>
                      <input className="input-ruby" placeholder="Casa, Trabalho..." value={newAddress.label} onChange={e => setNewAddress(a => ({...a, label: e.target.value}))} />
                    </div>
                  </div>
                  <div>
                    <label className="label-ruby">Rua / Logradouro *</label>
                    <input className="input-ruby" placeholder="Nome da rua" value={newAddress.street} onChange={e => setNewAddress(a => ({...a, street: e.target.value}))} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label-ruby">Número *</label>
                      <input className="input-ruby" placeholder="123" value={newAddress.number} onChange={e => setNewAddress(a => ({...a, number: e.target.value}))} />
                    </div>
                    <div className="col-span-2">
                      <label className="label-ruby">Complemento</label>
                      <input className="input-ruby" placeholder="Apto, Bloco..." value={newAddress.complement} onChange={e => setNewAddress(a => ({...a, complement: e.target.value}))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-ruby">Bairro *</label>
                      <input className="input-ruby" placeholder="Bairro" value={newAddress.neighborhood} onChange={e => setNewAddress(a => ({...a, neighborhood: e.target.value}))} />
                    </div>
                    <div>
                      <label className="label-ruby">Cidade *</label>
                      <input className="input-ruby" placeholder="Cidade" value={newAddress.city} onChange={e => setNewAddress(a => ({...a, city: e.target.value}))} />
                    </div>
                  </div>
                  <div>
                    <label className="label-ruby">Estado *</label>
                    <select className="input-ruby" value={newAddress.state} onChange={e => setNewAddress(a => ({...a, state: e.target.value}))}>
                      <option value="">Selecione</option>
                      {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveAddress} className="btn-ruby flex-1">Salvar Endereço</button>
                    <button onClick={() => setAddingAddress(false)} className="btn-outline px-4">Cancelar</button>
                  </div>
                </div>
              )}

              <button
                onClick={() => { if (!selectedAddress && addresses.length > 0) { toast.error('Selecione um endereço'); return; } if (addresses.length === 0) { toast.error('Adicione um endereço'); return; } setStep(2); }}
                disabled={!selectedAddress}
                className="btn-ruby w-full mt-6 py-4"
              >
                Continuar para Pagamento →
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="card p-6">
              <h2 className="font-body font-semibold text-gray-900 text-lg mb-5 flex items-center gap-2">
                <FiCreditCard className="text-ruby-500" /> Forma de Pagamento
              </h2>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'pix' ? 'border-ruby-500 bg-ruby-50' : 'border-gray-200 hover:border-ruby-200'}`}
                >
                  <RiQrCodeLine size={28} className={paymentMethod === 'pix' ? 'text-ruby-600' : 'text-gray-500'} />
                  <span className="font-body font-semibold text-sm">PIX</span>
                  <span className="text-xs text-green-600 font-medium">Instantâneo</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'credit_card' ? 'border-ruby-500 bg-ruby-50' : 'border-gray-200 hover:border-ruby-200'}`}
                >
                  <FiCreditCard size={28} className={paymentMethod === 'credit_card' ? 'text-ruby-600' : 'text-gray-500'} />
                  <span className="font-body font-semibold text-sm">Cartão</span>
                  <span className="text-xs text-gray-500">Até 12x</span>
                </button>
              </div>

              {paymentMethod === 'pix' && (
                <div className="bg-green-50 rounded-xl p-5 text-sm font-body">
                  <p className="font-semibold text-green-800 mb-2">✅ Pagamento por PIX</p>
                  <ul className="text-green-700 space-y-1">
                    <li>• QR Code gerado após confirmação do pedido</li>
                    <li>• Pague em qualquer banco ou carteira digital</li>
                    <li>• Confirmação automática em minutos</li>
                    <li>• Validade de 24 horas</li>
                  </ul>
                </div>
              )}

              {paymentMethod === 'credit_card' && (
                <div className="space-y-4">
                  <div>
                    <label className="label-ruby">Número do Cartão</label>
                    <input className="input-ruby" placeholder="0000 0000 0000 0000" maxLength={19}
                      value={cardData.number.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim()}
                      onChange={e => setCardData(d => ({...d, number: e.target.value.replace(/\D/g,'').slice(0,16)}))} />
                  </div>
                  <div>
                    <label className="label-ruby">Nome no Cartão</label>
                    <input className="input-ruby" placeholder="NOME COMO NO CARTÃO"
                      value={cardData.name} onChange={e => setCardData(d => ({...d, name: e.target.value.toUpperCase()}))} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="label-ruby">Validade</label>
                      <input className="input-ruby" placeholder="MM/AA" maxLength={5}
                        value={cardData.expiry.replace(/\D/g,'').replace(/(\d{2})(\d)/,'$1/$2')}
                        onChange={e => setCardData(d => ({...d, expiry: e.target.value.replace(/\D/g,'').slice(0,4)}))} />
                    </div>
                    <div className="col-span-1">
                      <label className="label-ruby">CVV</label>
                      <input className="input-ruby" placeholder="123" maxLength={4}
                        value={cardData.cvv} onChange={e => setCardData(d => ({...d, cvv: e.target.value.replace(/\D/g,'').slice(0,4)}))} />
                    </div>
                    <div className="col-span-1">
                      <label className="label-ruby">Parcelas</label>
                      <select className="input-ruby" value={cardData.installments} onChange={e => setCardData(d => ({...d, installments: e.target.value}))}>
                        {[...Array(12)].map((_, i) => (
                          <option key={i+1} value={i+1}>{i+1}x {i===0 ? 'sem juros' : `${formatPrice(total/(i+1))}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">🔒 Seus dados são protegidos e criptografados</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-outline px-5">← Voltar</button>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="btn-ruby flex-1 py-4"
                >
                  {placing ? 'Processando...' : `Confirmar Pedido · ${formatPrice(total)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <h3 className="font-body font-semibold text-gray-900 mb-4">Resumo</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {items.map(item => (
                <div key={item.key} className="flex gap-3 text-sm font-body">
                  {item.primary_image && (
                    <img src={item.primary_image} alt="" className="w-12 h-14 object-cover rounded-lg shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-gray-800 line-clamp-2">{item.product_name}</p>
                    <p className="text-gray-500 text-xs">{item.color_name} {item.size && `• ${item.size}`} • Qtd: {item.quantity}</p>
                    <p className="text-ruby-600 font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm font-body">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Frete</span><span className={shipping===0?'text-green-600':''}>{shipping===0?'Grátis':formatPrice(shipping)}</span></div>
              <div className="flex justify-between font-semibold text-gray-900 pt-1 text-base border-t border-gray-100">
                <span>Total</span><span className="font-display">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
