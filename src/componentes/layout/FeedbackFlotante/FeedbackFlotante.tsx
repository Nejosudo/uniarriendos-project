import DynamicIcon from '@/componentes/ui/DynamicIcon';
import styles from './FeedbackFlotante.module.css';

export default function FeedbackFlotante() {
    return (
        <a
            href="https://docs.google.com/forms/d/e/1FAIpQLScEKrWsmTEo--VghxizHpNmZjDvwoZzL_h5Wk_hP-tqsMJT7Q/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.wrapper}
            aria-label="Déjanos tu feedback"
        >
            <span className={styles.bubble}>¡Dejanos aquí tu feedback!</span>
            <span className={styles.button}>
                <DynamicIcon name="MessageCircle" size={24} />
            </span>
        </a>
    );
}
