import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';
import { Container, Section } from '@/components/layout';
import styles from './platform/PlatformPipeline.module.css';

interface Product {
  readonly key: string;
  readonly name: string;
  readonly description: ReactNode;
  readonly href: string;
}

const PRODUCTS: readonly Product[] = [
  {
    key: 'images',
    name: 'Clean Images',
    description: 'Reduce inherited risk with verified zero-CVE container foundations.',
    href: '/cleanstart-images',
  },
  {
    key: 'libs',
    name: 'Clean Libraries',
    description: (
      <>
        Govern dependencies with trusted <span className="whitespace-nowrap">open-source</span>{' '}
        libraries.
      </>
    ),
    href: '/clean-libraries',
  },
  {
    key: 'sight',
    name: 'CleanSight',
    description: 'Continuously identify inherited software supply chain risk.',
    href: '/cleansight',
  },
];

function Arrow(): ReactElement {
  return (
    <span className={styles.arrow} aria-hidden="true">
      <ChevronRight size={20} strokeWidth={1.5} />
    </span>
  );
}

function ProductRow({ product }: { readonly product: Product }): ReactElement {
  return (
    <article
      className={styles.product}
      data-product={product.key}
      aria-labelledby={`platform-${product.key}`}
    >
      <Link
        href={product.href}
        className={styles.productLink}
        aria-label={`Explore ${product.name}`}
        aria-describedby={`platform-${product.key}-description`}
      >
        <h3 id={`platform-${product.key}`} className={styles.productName}>
          {product.name}
        </h3>
        <p id={`platform-${product.key}-description`} className={styles.description}>
          {product.description}
        </p>
        <Arrow />
      </Link>
    </article>
  );
}

function IntelligenceHorizon(): ReactElement {
  return (
    <aside className={styles.horizon} aria-labelledby="platform-intelligence">
      <div className={styles.arc} aria-hidden="true" />
      <Link href="/tricorder" className={styles.foundationLink}>
        <h3 id="platform-intelligence" className={styles.foundationName}>
          CleanStart Intelligence Center
        </h3>
        <p className={styles.foundationDetail}>Tricorder powered analysis engine</p>
        <span className={styles.foundationCta}>
          Explore Tricorder
          <Arrow />
        </span>
      </Link>
    </aside>
  );
}

export function PlatformPipeline(): ReactElement {
  return (
    <Section
      padding="sm"
      className={`relative isolate overflow-hidden ${styles.section}`}
      aria-labelledby="platform-heading"
    >
      <Container className="relative">
        <div className={styles.platform}>
          <header className={styles.header}>
            <h2 id="platform-heading" className={styles.heading}>
              Trusted Software Delivery Starts Here
            </h2>
            <p className={styles.intro}>
              One analysis engine behind every product. Start from a verified base, govern what you
              depend on, and see supply chain risk as it appears.
            </p>
          </header>
          <ul className={styles.products} aria-label="CleanStart products">
            {PRODUCTS.map((product) => (
              <li key={product.key}>
                <ProductRow product={product} />
              </li>
            ))}
          </ul>
          <IntelligenceHorizon />
        </div>
      </Container>
    </Section>
  );
}
