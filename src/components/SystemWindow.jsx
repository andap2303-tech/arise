export default function SystemWindow({ title, variant, children }) {
  return (
    <div className={'sys-window' + (variant === 'purple' ? ' purple' : '')}>
      <span className="sys-corner-bl" />
      <span className="sys-corner-br" />
      {title && (
        <div className="sys-header">
          <span className="sys-diamond" />
          <h2>{title}</h2>
          <span className="sys-diamond" />
        </div>
      )}
      {children}
    </div>
  )
}
