import { Link } from 'react-router-dom';
import { FiInstagram, FiMail, FiPhone } from 'react-icons/fi';
import { RiGemLine, RiWhatsappLine } from 'react-icons/ri';
import { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function Footer() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.get('/api/settings').then(r => setSettings(r.data)).catch(() => {});
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="page-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-ruby-600 rounded-full flex items-center justify-center">
                <RiGemLine className="text-white text-xl" />
              </div>
              <div>
                <span className="font-display text-xl font-semibold text-white block leading-tight">
                  {settings.company_name?.split(' - ')[0] || 'Ruby'}
                </span>
                <span className="text-xs text-gray-400">Moda Íntima</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              {settings.tagline || 'Beleza sem limites, conforto em cada tamanho.'}
            </p>
            <div className="flex gap-3 mt-5">
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noreferrer"
                  className="w-9 h-9 bg-white/10 hover:bg-ruby-600 rounded-lg flex items-center justify-center transition-colors">
                  <FiInstagram size={18} />
                </a>
              )}
              {settings.whatsapp_number && (
                <a href={`https://wa.me/55${settings.whatsapp_number?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  className="w-9 h-9 bg-white/10 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors">
                  <RiWhatsappLine size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-display text-white text-lg font-semibold mb-4">Categorias</h4>
            <ul className="space-y-2.5">
              {['Sutiãs', 'Calcinhas', 'Conjuntos', 'Camisolas', 'Pijamas'].map(cat => (
                <li key={cat}>
                  <Link to={`/produtos?category=${cat.toLowerCase().replace('ã','a')}`}
                    className="text-sm text-gray-400 hover:text-ruby-400 transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display text-white text-lg font-semibold mb-4">Minha Conta</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Fazer Login', to: '/login' },
                { label: 'Criar Conta', to: '/cadastro' },
                { label: 'Meus Pedidos', to: '/meus-pedidos' },
                { label: 'Favoritos', to: '/favoritos' },
                { label: 'Carrinho', to: '/carrinho' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-gray-400 hover:text-ruby-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-white text-lg font-semibold mb-4">Contato</h4>
            <ul className="space-y-3">
              {settings.contact_email && (
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <FiMail size={15} className="text-ruby-400 shrink-0" />
                  <a href={`mailto:${settings.contact_email}`} className="hover:text-ruby-400 transition-colors">
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {settings.contact_phone && (
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <FiPhone size={15} className="text-ruby-400 shrink-0" />
                  {settings.contact_phone}
                </li>
              )}
            </ul>
            <div className="mt-6">
              <p className="text-xs text-gray-500 mb-2">Formas de pagamento</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-white/10 px-2.5 py-1 rounded-md">PIX</span>
                <span className="text-xs bg-white/10 px-2.5 py-1 rounded-md">Crédito</span>
                <span className="text-xs bg-white/10 px-2.5 py-1 rounded-md">Débito</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} {settings.company_name || 'Ruby - Moda Íntima'}. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-600">Plus size do 44 ao 60 🌹</p>
        </div>
      </div>
    </footer>
  );
}
