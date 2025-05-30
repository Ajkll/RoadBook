import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CommentState {
  comment: string;
  shouldAskForComment: boolean;
}

const initialState: CommentState = {
  comment: '',
  shouldAskForComment: true,
};

const commentSlice = createSlice({
  name: 'comment',
  initialState,
  reducers: {
    setComment: (state, action: PayloadAction<string>) => {
      state.comment = action.payload;
    },
    setShouldAskForComment: (state, action: PayloadAction<boolean>) => {
      state.shouldAskForComment = action.payload;
    },
    resetCommentState: () => initialState,
  },
});

export const { setComment, setShouldAskForComment, resetCommentState } = commentSlice.actions;
export default commentSlice.reducer;