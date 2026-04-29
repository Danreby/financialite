import React from 'react'
import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { FeatureCard, SocialCard, TechCard } from '@/Components/system/about/AboutCards'
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer'
import { useFadeInAnimation } from '@/Hooks/useFadeInAnimation'
import { QRCodeSVG } from 'qrcode.react'

export default function About() {
  const { featureVariants } = useFadeInAnimation()

  const features = [
    {
      icon: '📊',
      title: 'Acompanhe Faturas',
      description: 'Controle suas faturas mês a mês com pagamentos organizados',
    },
    {
      icon: '💳',
      title: 'Registre Transações',
      description: 'Compras em crédito, débito, recorrentes e parceladas',
    },
    {
      icon: '🏦',
      title: 'Organize Contas',
      description: 'Gerencie contas bancárias e categorias para relatórios claros',
    },
    {
      icon: '📈',
      title: 'Painel Visual',
      description: 'Visão geral completa de suas finanças mensais',
    },
    {
      icon: '📥',
      title: 'Exporte Dados',
      description: 'Baixe planilhas Excel com dados das próximas faturas',
    },
    {
      icon: '⚡',
      title: 'Interface Rápida',
      description: 'Aplicação leve e responsiva para qualquer dispositivo',
    },
  ]

  const socialLinks = [
    {
      label: 'Portfólio',
      url: 'https://danreby.github.io/danreby-portifolio/',
      icon: '🌐',
    },
    {
      label: 'GitHub',
      url: 'https://github.com/Danreby',
      icon: '💻',
    },
    {
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/bernardo-rolim-aa6802213/',
      icon: '🔗',
    },
  ]

  const apkDownloadUrl = '/downloads/financialite.apk'

  return (
    <AuthenticatedLayout>
      <Head title="Sobre" />
      <FadeInContainer className="w-full max-w-6xl mx-auto space-y-12 sm:space-y-14 px-3 sm:px-4 lg:px-6">
        <FadeInItem>
          <header className="pt-1 sm:pt-2 space-y-4">
            <FadeInItem
              className="mb-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-2xl shadow-md text-white"
                style={{ background: 'linear-gradient(to bottom right, var(--theme-primary), var(--theme-accent))' }}
              >
                💰
              </span>
            </FadeInItem>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 dark:text-gray-100">
              Financialite
            </h1>
            <p className="mt-1 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              Seu gerenciador financeiro pessoal inteligente e moderno
            </p>
            <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
              Desenvolvido por{' '}
              <a
                href="https://danreby.github.io/danreby-portifolio/"
                className="font-semibold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Bernardo Santos Rolim
              </a>
              , um desenvolvedor full-stack apaixonado por aplicações web modernas. Uma ferramenta simples
              e eficiente para o gerenciamento de faturas, transações e despesas.
            </p>
          </header>
        </FadeInItem>

        <FadeInItem>
          <section className="mb-4">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Recursos Disponíveis
            </h2>
            <FadeInContainer stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, index) => (
                <FadeInItem key={index} type="feature">
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    variants={featureVariants}
                  />
                </FadeInItem>
              ))}
            </FadeInContainer>
          </section>
        </FadeInItem>

        <FadeInItem>
          <section className="mb-4 themed-section-highlight rounded-3xl p-6 sm:p-8 lg:p-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Sobre o Projeto
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p className="text-base sm:text-lg">
                Financialite é uma aplicação em constante evolução, desenvolvida com as tecnologias
                mais modernas para garantir uma experiência de usuário excepcional. Novos recursos são
                adicionados regularmente, refinando fluxos conforme o uso diário. É possivel analisar o código acessando o{' '}
                <a
                  href="https://github.com/Danreby/financialite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                >
                  repositório
                </a>{' '}
                no GitHub.
              </p>
              <p className="text-base sm:text-lg">
                <span className="font-semibold text-blue-600 dark:text-blue-400">100% Pessoal:</span>{' '}
                Este projeto não será monetizado, não contém anúncios e seus dados estão seguros. É
                desenvolvido puramente para fins pessoais e não comerciais.
              </p>
              <p className="text-base sm:text-lg">
                <span className="font-semibold text-green-600 dark:text-green-400">Código Aberto:</span>{' '}
                Sinta-se à vontade para explorar o repositório, contribuir com sugestões ou reportar
                bugs através do GitHub.
              </p>
              <p className="text-base sm:text-lg">
                <span className="font-semibold text-red-600 dark:text-red-400">Doações:</span>{' '}
                Sinta-se à vontade para apoiar o projeto através de doações, contribuindo para a manutenção e desenvolvimento contínuo da aplicação.
              </p>
            </div>
          </section>
        </FadeInItem>

        <FadeInItem>
          <section className="rounded-2xl p-6 sm:p-8 lg:p-10 shadow-md themed-card">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              QR Code
            </h2>

            <div className="flex flex-col items-center gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-md">
                <QRCodeSVG
                  value="00020126580014BR.GOV.BCB.PIX0136b82b0e92-1e07-4bf8-bc71-0f50d637dabc5204000053039865802BR5921Bernardo Santos Rolim6009SAO PAULO62140510PJqP5lNZeX63043E21"
                  size={220}
                  level="M"
                  includeMargin={false}
                />
              </div>
              {/* <div className="text-center space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Bernardo Santos Rolim</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nubank · Chave aleatória</p>
              </div> */}
            </div>
          </section>
        </FadeInItem>

        <FadeInItem>
          <section className="rounded-2xl p-6 sm:p-8 lg:p-10 shadow-md themed-card">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              📱 Aplicativo Mobile
            </h2>
            <div className="space-y-4">
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                O Financialite também está disponível como aplicativo Android!
                {/* Gerencie suas finanças de qualquer lugar, com sincronização em tempo real
                com a versão web. */}
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <a
                  href={apkDownloadUrl}
                  download
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
                  style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-accent))' }}
                >
                  <span className="text-lg">⬇️</span>
                  Baixar APK (Android)
                </a>
                {/* <a
                  href="https://github.com/Danreby/FinancialiteAPK/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Ver todas as versões →
                </a> */}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ao instalar, pode ser necessário habilitar &quot;Fontes desconhecidas&quot; nas configurações do Android.
              </p>
            </div>
          </section>
        </FadeInItem>

        <FadeInItem>
          <section className="mb-4">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Conecte-se Comigo
            </h2>
            <FadeInContainer stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {socialLinks.map((link, index) => (
                <FadeInItem key={index} type="feature">
                  <SocialCard
                    icon={link.icon}
                    label={link.label}
                    url={link.url}
                    variants={featureVariants}
                  />
                </FadeInItem>
              ))}
            </FadeInContainer>
          </section>
        </FadeInItem>

        <FadeInItem>
          <section className="rounded-2xl p-6 sm:p-8 lg:p-10 shadow-md themed-card">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Tecnologias Utilizadas
            </h2>
            <FadeInContainer stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { name: 'Laravel', icon: '🚀' },
                { name: 'React', icon: '⚛️' },
                { name: 'Tailwind CSS', icon: '🎨' },
                { name: 'Inertia.js', icon: '🔗' },
                { name: 'MySQL', icon: '🗄️' },
                { name: 'Vite', icon: '⚡' },
                // { name: 'Flutter', icon: '📱' },
                { name: 'Framer Motion', icon: '✨' },
                { name: 'JavaScript', icon: '📝' },
              ].map((tech, index) => (
                <FadeInItem key={index} type="feature">
                  <TechCard
                    icon={tech.icon}
                    name={tech.name}
                    variants={featureVariants}
                  />
                </FadeInItem>
              ))}
            </FadeInContainer>
          </section>
        </FadeInItem>
      </FadeInContainer>
    </AuthenticatedLayout>
  )
}