import {
    EnvironmentOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    FacebookFilled,
    YoutubeFilled,
    InstagramOutlined,
} from "@ant-design/icons";
import "../styles/footer.css";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="site-footer__container">
                <div className="site-footer__left">
                    <h3 className="site-footer__title">Thông tin liên hệ</h3>

                    <ul className="site-footer__list">
                        <li className="site-footer__item">
                            <span className="site-footer__icon">
                                <HomeOutlined />
                            </span>
                            <span className="site-footer__text">Trường THPT Vị Thủy</span>
                        </li>

                        <li className="site-footer__item">
                            <span className="site-footer__icon">
                                <EnvironmentOutlined />
                            </span>
                            <span className="site-footer__text">Hậu Giang</span>
                        </li>

                        <li className="site-footer__item">
                            <span className="site-footer__icon">
                                <MailOutlined />
                            </span>
                            <a
                                className="site-footer__link"
                                href="mailto:contact@domain.com"
                            >
                                contact@domain.com
                            </a>
                        </li>

                        <li className="site-footer__item">
                            <span className="site-footer__icon">
                                <PhoneOutlined />
                            </span>
                            <a className="site-footer__link" href="tel:1800xxxx">
                                1800xxxx
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="site-footer__right">
                    <div className="site-footer__social">
                        <a
                            href="https://facebook.com"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Facebook"
                            className="site-footer__social-link"
                        >
                            <FacebookFilled />
                        </a>

                        <a
                            href="https://youtube.com"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="YouTube"
                            className="site-footer__social-link"
                        >
                            <YoutubeFilled />
                        </a>

                        <a
                            href="https://instagram.com"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Instagram"
                            className="site-footer__social-link"
                        >
                            <InstagramOutlined />
                        </a>
                    </div>

                    <div className="site-footer__copyright">
                        © Copyright {year}
                    </div>
                </div>
            </div>
        </footer>
    );
}