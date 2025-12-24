import React from 'react'
import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'

export default function About() {
	return (
		<AuthenticatedLayout>
			<Head title="Sobre" />
			<div className="w-full max-w-3xl mx-auto px-3 py-6 space-y-5 sm:px-4 sm:py-8 lg:px-6">
				<header className="space-y-2">
					<h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 sm:text-2xl">
						Sobre o Projeto
					</h1>
					<p className="text-xs text-gray-600 dark:text-gray-300 sm:text-sm">
						O projeto foi criado por <a href="https://danreby.github.io/danreby-portifolio/" className='font-medium text-blue-500 hover:underline'>Bernardo Santos Rolim</a>,
                        desenvolvedor full-stack com foco em aplicações web modernas. O objetivo principal é fornecer
                        uma ferramenta simples e eficiente para o gerenciamento financeiro pessoal. Gerênciamento de faturas e registro de transações para rastrear despesas de forma prática.
					</p>
                    <p>
                        Pode saber mais sobre mim e meus outros projetos visitando minhas redes sociais:
                        <ul className="list-disc list-inside mt-2 text-xs text-gray-600 dark:text-gray-300 sm:text-sm">
                            <li>Site Pessoal: <a href="https://danreby.github.io/danreby-portifolio/" className='font-medium text-blue-500 hover:underline'>bernardo.portifolio</a></li>
                            <li>GitHub: <a href="https://github.com/Danreby" className='font-medium text-blue-500 hover:underline'>github.com/Danreby</a></li>
                            <li>LinkedIn: <a href="https://www.linkedin.com/in/bernardo-rolim-aa6802213/" className='font-medium text-blue-500 hover:underline'>linkedin.com/in/bernardo-rolim/</a></li>
                        </ul>
                    </p>
				</header>

				<section className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5 dark:bg-[#0b0b0b] dark:ring-black/30 sm:p-5">
					<h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">
						O que é possível fazer com esta aplicação?
					</h2>
					<ul className="mt-3 space-y-2 text-xs text-gray-700 dark:text-gray-300 sm:text-sm">
						<li>• Acompanhar suas faturas mês a mês e controlar pagamentos.</li>
						<li>• Registrar compras no crédito e no débito, inclusive compras recorrentes e parcelamentos.</li>
						<li>• Organizar contas bancárias e categorias para ter relatórios mais claros.</li>
						<li>• Visualizar um painel com visão geral das finanças do mês.</li>
						<li>• Fazer download de uma planilha excel com os dados das próximas faturas.</li>
					</ul>
				</section>

				<section className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5 dark:bg-[#0b0b0b] dark:ring-black/30 sm:p-5">
					<h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">
						Sobre este projeto
					</h2>
					<p className="mt-3 text-xs leading-relaxed text-gray-700 dark:text-gray-300 sm:text-sm">
						Esta é uma aplicação em constante evolução. Novos recursos podem ser adicionados com o tempo
						e alguns fluxos podem ser refinados conforme o uso diário. Use esta página apenas como um
						ponto de referência geral e pessoal. Este projeto não será monetizado de nenhuma forma e
                        não haverá anúncios ou vendas de dados, será usado puramente para fins pessoais e não comerciais. Sinta-se à vontade para contribuir com sugestões ou
                        reportar bugs através do meu GitHub.
					</p>
				</section>
			</div>
		</AuthenticatedLayout>
	)
}

