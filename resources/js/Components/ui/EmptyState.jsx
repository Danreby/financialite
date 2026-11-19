import { Inbox } from 'lucide-react';
import cx from './cx';
import renderIcon from './renderIcon';

/** Estado vazio: ícone (lucide), título, texto e uma ação opcional. */
export default function EmptyState({ icon, title, text, action, className = '' }) {
    return (
        <div className={cx('flex flex-col items-center px-4 py-10 text-center', className)}>
            <span className="icon-chip mb-4 h-12 w-12 [&_svg]:h-[22px] [&_svg]:w-[22px]">
                {renderIcon(icon, {}, Inbox)}
            </span>
            <h3 className="text-[15px] font-semibold text-content-primary text-balance">{title}</h3>
            {text && <p className="mt-1 max-w-sm text-sm text-content-muted text-pretty">{text}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
