import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <span className={styles.icon}>📖</span>
      <h1 className={styles.title}>PDF To Book</h1>
    </header>
  )
}
