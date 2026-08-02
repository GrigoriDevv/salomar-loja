import { useState } from 'react'

interface ProductGalleryProps {
  images: string[]
  alt: string
  focus: string
}

export function ProductGallery({ images, alt, focus }: ProductGalleryProps) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]

  if (!current) return null

  return (
    <div className="product-gallery">
      <div className="product-gallery__main">
        <img src={current} alt={alt} style={{ objectPosition: focus }} />
      </div>

      {images.length > 1 && (
        <ul className="product-gallery__thumbs" aria-label="Mais fotos">
          {images.map((src, index) => (
            <li key={`${src}-${index}`}>
              <button
                type="button"
                className={index === active ? 'is-active' : ''}
                aria-label={`Foto ${index + 1}`}
                aria-pressed={index === active}
                onClick={() => setActive(index)}
              >
                <img src={src} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
