import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ImageGallery } from './ImageGallery';
import type { ProtoImageDto } from '../models/catalogApi';

const images: ProtoImageDto[] = [
  { id: 'img-1', url: 'https://example.com/1.jpg', order: 1 },
  { id: 'img-2', url: 'https://example.com/2.jpg', order: 0 },
  { id: 'img-3', url: 'https://example.com/3.jpg', order: 2 },
];

describe('ImageGallery', () => {
  it('renders "No images" when empty', () => {
    render(<ImageGallery images={[]} altPrefix="Test" />);
    expect(screen.getByText('No images')).toBeInTheDocument();
  });

  it('renders images sorted by order', () => {
    render(<ImageGallery images={images} altPrefix="Product" />);
    // First displayed image should be order=0 (img-2)
    const mainImage = screen.getByAltText('Product — image 1');
    expect(mainImage).toHaveAttribute('src', 'https://example.com/2.jpg');
  });

  it('navigates to next image on "Next image" click', () => {
    render(<ImageGallery images={images} altPrefix="Product" />);
    const nextBtn = screen.getByLabelText('Next image');
    fireEvent.click(nextBtn);
    const mainImage = screen.getByAltText('Product — image 2');
    expect(mainImage).toHaveAttribute('src', 'https://example.com/1.jpg');
  });

  it('navigates to previous image (wraps around)', () => {
    render(<ImageGallery images={images} altPrefix="Product" />);
    const prevBtn = screen.getByLabelText('Previous image');
    fireEvent.click(prevBtn);
    // Wraps from 0 → last (order=2, img-3)
    const mainImage = screen.getByAltText('Product — image 3');
    expect(mainImage).toHaveAttribute('src', 'https://example.com/3.jpg');
  });

  it('renders thumbnail buttons for each image', () => {
    render(<ImageGallery images={images} altPrefix="Product" />);
    expect(screen.getByLabelText('Image 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Image 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Image 3')).toBeInTheDocument();
  });

  it('clicking a thumbnail selects that image', () => {
    render(<ImageGallery images={images} altPrefix="Product" />);
    const thumb3 = screen.getByLabelText('Image 3');
    fireEvent.click(thumb3);
    const mainImage = screen.getByAltText('Product — image 3');
    expect(mainImage).toHaveAttribute('src', 'https://example.com/3.jpg');
  });

  it('does not show navigation buttons for single image', () => {
    render(<ImageGallery images={[images[0]]} altPrefix="Single" />);
    expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
  });
});
