import React, { useState } from 'react';
import { FaStar, FaPlus, FaMinus } from 'react-icons/fa';
import './Feedback.css';

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedback: ''
  });

  const reviews = [
    {
      name: "Alisha Mathies",
      rating: 5,
      comment: "This app has revolutionized how I handle my meeting notes. The transcription is incredibly accurate!",
      date: "April 5, 2025"
    },
    {
      name: "Jash Patel",
      rating: 4,
      comment: "Great tool for students! Makes lecture recording management so much easier.",
      date: "April 3, 2025"
    },
    {
      name: "Deep Naidu",
      rating: 5,
      comment: "The best transcription service I've used. The team plan is perfect for our company.",
      date: "April 1, 2025"
    }
  ];

  const faqs = [
    {
      question: "How accurate is the transcription?",
      answer: "Our AI-powered transcription service boasts a 95%+ accuracy rate for clear audio in standard accents. The accuracy may vary depending on audio quality, background noise, and accent complexity."
    },
    {
      question: "What file formats are supported?",
      answer: "We support most common audio and video formats including MP3, WAV, MP4, M4A, and AAC. Files should be under 5GB in size for optimal processing."
    },
    {
      question: "How long does transcription take?",
      answer: "Transcription time depends on the file length and your plan. Free users typically receive transcripts within 30-60 minutes, while Premium users get priority processing with results in 10-15 minutes."
    },
    {
      question: "Is my data secure?",
      answer: "Yes! We use industry-standard encryption for all file transfers and storage. Your files are automatically deleted after 30 days unless you choose to keep them longer."
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the feedback to your backend
    console.log('Feedback submitted:', formData);
    // Reset form
    setFormData({ name: '', email: '', feedback: '' });
    setRating(0);
    alert('Thank you for your feedback!');
  };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="feedback-container">
      {/* Feedback Form Section */}
      <section className="feedback-section">
        <h2>Share Your Feedback</h2>
        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Rating</label>
            <div className="star-rating">
              {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                  <FaStar
                    key={index}
                    className={ratingValue <= (hover || rating) ? 'star active' : 'star'}
                    onClick={() => setRating(ratingValue)}
                    onMouseEnter={() => setHover(ratingValue)}
                    onMouseLeave={() => setHover(0)}
                  />
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="feedback">Your Feedback</label>
            <textarea
              id="feedback"
              name="feedback"
              value={formData.feedback}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" className="submit-btn">Submit Feedback</button>
        </form>
      </section>

      {/* Reviews Section */}
      <section className="reviews-section">
        <h2>What Our Users Say</h2>
        <div className="reviews-grid">
          {reviews.map((review, index) => (
            <div key={index} className="review-card">
              <div className="review-header">
                <h3>{review.name}</h3>
                <div className="review-stars">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={i < review.rating ? 'star active' : 'star'}
                    />
                  ))}
                </div>
              </div>
              <p className="review-comment">{review.comment}</p>
              <p className="review-date">{review.date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs Section */}
      <section className="faqs-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${expandedFaq === index ? 'expanded' : ''}`}
              onClick={() => toggleFaq(index)}
            >
              <div className="faq-question">
                <h3>{faq.question}</h3>
                {expandedFaq === index ? <FaMinus /> : <FaPlus />}
              </div>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Feedback;
