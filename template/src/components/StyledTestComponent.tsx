import React from 'react';
import styled from 'styled-components';
import { Card, Button } from 'antd';

/**
 * @component StyledTestComponent  
 * @description Component demonstrating styled-components + Ant Design integration
 * @category UI Components
 * @param {string} title - Component title
 * @param {boolean} highlighted - Whether to highlight the component
 * @example
 * <StyledTestComponent title="Test" highlighted={true} />
 */
interface StyledTestComponentProps {
  title: string;
  highlighted?: boolean;
}

const StyledWrapper = styled.div<{ highlighted: boolean }>`
  padding: 16px;
  margin: 16px 0;
  border-radius: 8px;
  background: ${props => props.highlighted ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5'};
  color: ${props => props.highlighted ? 'white' : 'inherit'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  }
`;

const StyledTitle = styled.h3<{ highlighted: boolean }>`
  color: ${props => props.highlighted ? '#ffffff' : '#1890ff'};
  font-size: 1.2rem;
  margin-bottom: 12px;
`;

const StyledButton = styled(Button)<{ highlighted: boolean }>`
  border-color: ${props => props.highlighted ? 'rgba(255,255,255,0.3)' : undefined};
  color: ${props => props.highlighted ? 'white' : undefined};
  
  &:hover {
    border-color: ${props => props.highlighted ? 'white' : undefined} !important;
    color: ${props => props.highlighted ? 'white' : undefined} !important;
  }
`;

export const StyledTestComponent: React.FC<StyledTestComponentProps> = ({ 
  title, 
  highlighted = false 
}) => (
  <StyledWrapper highlighted={highlighted}>
    <Card 
      style={{ 
        background: highlighted ? 'rgba(255,255,255,0.1)' : undefined,
        border: highlighted ? '1px solid rgba(255,255,255,0.2)' : undefined 
      }}
    >
      <StyledTitle highlighted={highlighted}>{title}</StyledTitle>
      <p>This demonstrates:</p>
      <ul>
        <li>styled-components theming</li>
        <li>Ant Design component styling</li>
        <li>TypeScript prop integration</li>
        <li>Responsive design patterns</li>
      </ul>
      <StyledButton 
        type={highlighted ? "default" : "primary"}
        highlighted={highlighted}
        style={{ marginTop: 12 }}
      >
        Test Action
      </StyledButton>
    </Card>
  </StyledWrapper>
);