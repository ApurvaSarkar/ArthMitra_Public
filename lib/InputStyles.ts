import { StyleSheet } from 'react-native';

export const commonInputStyles = {
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch' as 'stretch',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500' as '500',
    color: '#ffffff',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: 'rgba(67, 97, 238, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: 50,
    shadowColor: '#4361ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  inputWrapper: {
    paddingHorizontal: 0,
    marginBottom: 10,
  },
  input: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 10,
  },
};

export default StyleSheet.create(commonInputStyles);